import { Router, type IRouter, Request, Response } from "express";
import { getRecentThreats, getThreatStats, addSseClient, removeSseClient } from "../lib/threat-store.js";

const router: IRouter = Router();

router.get("/threats", (_req: Request, res: Response) => {
  const threats = getRecentThreats(100);
  res.json({ threats });
});

router.get("/threats/stats", (_req: Request, res: Response) => {
  const stats = getThreatStats();
  res.json(stats);
});

router.get("/threats/stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  res.write(": connected\n\n");

  addSseClient(res);

  req.on("close", () => {
    removeSseClient(res);
  });
});

router.post("/scan", (req: Request, res: Response) => {
  const body = req.body as { payload?: string };
  const payload = body?.payload;

  if (!payload || typeof payload !== "string") {
    res.status(400).json({ error: "payload field (string) is required" });
    return;
  }

  const results: { category: string; detected: boolean; matches: string[] }[] = [
    { category: "SQL Injection", detected: false, matches: [] },
    { category: "XSS", detected: false, matches: [] },
    { category: "Command Injection", detected: false, matches: [] },
    { category: "Path Traversal", detected: false, matches: [] },
    { category: "OAuth Attack", detected: false, matches: [] },
    { category: "NoSQL Injection", detected: false, matches: [] },
  ];

  const SQL_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|TRUNCATE)\b)/gi,
    /('|")\s*(OR|AND)\s*('|"|\d)/gi,
    /;\s*(DROP|DELETE|UPDATE)/gi,
    /--\s*(SELECT|INSERT)/gi,
    /\b(SLEEP|BENCHMARK)\s*\(/gi,
    /INFORMATION_SCHEMA/gi,
  ];
  const XSS_PATTERNS = [
    /<script[\s\S]*?>/gi,
    /javascript\s*:/gi,
    /on\w+\s*=/gi,
    /<(iframe|object|embed)\b/gi,
    /\beval\s*\(/gi,
    /document\.cookie/gi,
  ];
  const CMD_PATTERNS = [
    /[;&|`$]\s*(ls|cat|pwd|id|whoami|wget|curl|bash|sh)/gi,
    /\$\(.*\)/g,
    /`[^`]+`/g,
  ];
  const PATH_PATTERNS = [
    /\.\.\//g,
    /\.\.%2f/gi,
    /\/etc\/passwd/gi,
    /\/proc\/self/gi,
  ];
  const OAUTH_PATTERNS = [
    /redirect_uri=.*javascript:/gi,
    /redirect_uri=.*data:/gi,
  ];
  const NOSQL_PATTERNS = [
    /\$where/gi,
    /\$ne\b/gi,
    /\$gt\b/gi,
    /\$regex\b/gi,
  ];

  const patternSets = [
    [SQL_PATTERNS, 0],
    [XSS_PATTERNS, 1],
    [CMD_PATTERNS, 2],
    [PATH_PATTERNS, 3],
    [OAUTH_PATTERNS, 4],
    [NOSQL_PATTERNS, 5],
  ] as [RegExp[], number][];

  for (const [patterns, idx] of patternSets) {
    for (const p of patterns) {
      const match = payload.match(p);
      if (match) {
        results[idx].detected = true;
        results[idx].matches.push(...match.slice(0, 3));
      }
    }
  }

  const clean = results.every(r => !r.detected);
  res.json({
    payload: payload.slice(0, 100),
    safe: clean,
    threats: results.filter(r => r.detected),
    scanned_at: new Date().toISOString(),
  });
});

export default router;
