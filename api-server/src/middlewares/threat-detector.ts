import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { pushThreatEntry } from "../lib/threat-store.js";

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|TRUNCATE|REPLACE)\b.*\b(FROM|INTO|WHERE|TABLE|DATABASE)\b)/gi,
  /('|")\s*(OR|AND)\s*('|"|\d)/gi,
  /;\s*(DROP|DELETE|UPDATE|INSERT|EXEC)/gi,
  /--\s*(SELECT|INSERT|UPDATE|DROP)/gi,
  /\/\*.*\*\//g,
  /\b(SLEEP|BENCHMARK|WAITFOR)\s*\(/gi,
  /\b(xp_cmdshell|OPENROWSET|BULK\s+INSERT)\b/gi,
  /INFORMATION_SCHEMA\.(TABLES|COLUMNS)/gi,
  /sys\.(tables|columns|databases)/gi,
  /0x[0-9a-fA-F]{2,}/g,
  /char\(\d+\)/gi,
  /\bconcat\s*\(.*\)/gi,
  /\bcast\s*\(.*\s+as\s+/gi,
  /\bconvert\s*\(.*,/gi,
  /'\s*=\s*'/g,
];

const XSS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /javascript\s*:/gi,
  /on(load|click|error|mouseover|focus|blur|change|submit|keyup|keydown|keypress)\s*=/gi,
  /<(iframe|object|embed|applet|link|style|meta|base)\b/gi,
  /expression\s*\(/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /&#(x[0-9a-fA-F]+|[0-9]+);/gi,
  /%3c.*%3e/gi,
  /\balert\s*\(/gi,
  /\beval\s*\(/gi,
  /document\.(cookie|location|write)/gi,
  /window\.(location|open)/gi,
];

const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//g,
  /\.\.%2f/gi,
  /%2e%2e\//gi,
  /\.\.\\/g,
  /\.\.%5c/gi,
  /%252e%252e/gi,
  /\/etc\/passwd/gi,
  /\/etc\/shadow/gi,
  /\/proc\/self/gi,
  /\/windows\/system32/gi,
  /\bboot\.ini\b/gi,
];

const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$]\s*(ls|cat|pwd|id|whoami|wget|curl|nc|bash|sh|python|perl|ruby)/gi,
  /\$\(.*\)/g,
  /`[^`]+`/g,
  /\|\s*(bash|sh|cmd|powershell)/gi,
  /\b(eval|exec|system|passthru|shell_exec|popen)\s*\(/gi,
];

const OAUTH_ATTACK_PATTERNS = [
  /redirect_uri=.*javascript:/gi,
  /redirect_uri=.*data:/gi,
  /redirect_uri=.*(localhost|127\.0\.0\.1|0\.0\.0\.0)/gi,
  /state=.{0,5}$/,
  /\bopen.?redirect\b/gi,
  /grant_type=.*<[^>]+>/gi,
];

const NOSQL_INJECTION_PATTERNS = [
  /\$where/gi,
  /\$ne\b/gi,
  /\$gt\b/gi,
  /\$lt\b/gi,
  /\$regex\b/gi,
  /\$exists\b/gi,
  /\$elemMatch\b/gi,
  /\$in\b.*\[/gi,
];

export interface ThreatResult {
  detected: boolean;
  type?: string;
  severity?: "low" | "medium" | "high" | "critical";
  detail?: string;
  sanitized?: string;
}

function checkPatterns(value: string, patterns: RegExp[], type: string, severity: ThreatResult["severity"]): ThreatResult | null {
  for (const pattern of patterns) {
    if (pattern.test(value)) {
      const sanitized = value.replace(pattern, "[BLOCKED]");
      return { detected: true, type, severity, detail: `Matched pattern: ${pattern.source.slice(0, 60)}`, sanitized };
    }
  }
  return null;
}

function analyzeValue(value: string): ThreatResult {
  if (!value || typeof value !== "string") return { detected: false };

  const checks: [RegExp[], string, ThreatResult["severity"]][] = [
    [SQL_INJECTION_PATTERNS, "SQL_INJECTION", "critical"],
    [XSS_PATTERNS, "XSS", "high"],
    [COMMAND_INJECTION_PATTERNS, "COMMAND_INJECTION", "critical"],
    [PATH_TRAVERSAL_PATTERNS, "PATH_TRAVERSAL", "high"],
    [OAUTH_ATTACK_PATTERNS, "OAUTH_ATTACK", "high"],
    [NOSQL_INJECTION_PATTERNS, "NOSQL_INJECTION", "high"],
  ];

  for (const [patterns, type, severity] of checks) {
    const result = checkPatterns(value, patterns, type, severity);
    if (result) return result;
  }

  return { detected: false };
}

function flattenObject(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      Object.assign(result, flattenObject(val as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = String(val ?? "");
    }
  }
  return result;
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  if (typeof obj !== "object" || obj === null) return obj;
  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === "string") {
      let sanitized = val;
      for (const patterns of [SQL_INJECTION_PATTERNS, XSS_PATTERNS, COMMAND_INJECTION_PATTERNS]) {
        for (const p of patterns) {
          sanitized = sanitized.replace(p, "[REMOVED]");
        }
      }
      clean[key] = sanitized;
    } else if (typeof val === "object" && val !== null) {
      clean[key] = sanitizeObject(val as Record<string, unknown>);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

export function threatDetector(req: Request, res: Response, next: NextFunction) {
  const threats: ThreatResult[] = [];
  const sources: string[] = [];

  const checkSource = (data: Record<string, unknown> | undefined, label: string) => {
    if (!data) return;
    const flat = flattenObject(data);
    for (const [field, value] of Object.entries(flat)) {
      const result = analyzeValue(value);
      if (result.detected) {
        threats.push({ ...result, detail: `Field: ${field} — ${result.detail}` });
        sources.push(label);
      }
    }
  };

  const checkString = (value: string | undefined, label: string) => {
    if (!value) return;
    const result = analyzeValue(value);
    if (result.detected) {
      threats.push({ ...result, detail: `${label}: ${result.detail}` });
      sources.push(label);
    }
  };

  checkSource(req.query as Record<string, unknown>, "query");
  checkSource(req.body as Record<string, unknown>, "body");
  checkSource(req.params as Record<string, unknown>, "params");
  checkString(req.headers["user-agent"], "user-agent");
  checkString(req.headers["referer"], "referer");
  checkString(req.url, "url");

  if (threats.length > 0) {
    const highestSeverity = threats.some(t => t.severity === "critical")
      ? "critical"
      : threats.some(t => t.severity === "high")
        ? "high"
        : threats.some(t => t.severity === "medium")
          ? "medium"
          : "low";

    const logEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ip: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown",
      method: req.method,
      path: req.path,
      severity: highestSeverity,
      threats: threats.map(t => ({ type: t.type, severity: t.severity, detail: t.detail })),
      sources,
      userAgent: req.headers["user-agent"] || "",
      blocked: highestSeverity === "critical" || highestSeverity === "high",
    };

    pushThreatEntry(logEntry);

    req.log?.warn({ securityEvent: logEntry }, "Security threat detected");

    if (logEntry.blocked) {
      res.status(400).json({
        error: "Request blocked by security policy",
        requestId: logEntry.id,
      });
      return;
    }

    if (req.body && typeof req.body === "object") {
      (req as Request & { body: Record<string, unknown> }).body = sanitizeObject(req.body as Record<string, unknown>);
    }
  }

  next();
}
