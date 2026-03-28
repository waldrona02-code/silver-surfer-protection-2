import { Request, Response, NextFunction } from "express";

const BLOCKED_HEADERS = ["x-powered-by", "server", "via", "x-aspnet-version", "x-aspnetmvc-version"];

export function sessionHardener(req: Request, res: Response, next: NextFunction) {
  for (const h of BLOCKED_HEADERS) {
    res.removeHeader(h);
  }

  res.setHeader("Vary", "Origin, Accept-Encoding");

  const cookie = req.headers.cookie;
  if (cookie) {
    const suspicious = /[<>"'&;]/;
    if (suspicious.test(cookie)) {
      req.log?.warn({ cookie: "[REDACTED]" }, "Suspicious cookie value detected");
    }
  }

  next();
}

export function validateContentType(req: Request, res: Response, next: NextFunction) {
  const methodsRequiringBody = ["POST", "PUT", "PATCH"];
  if (methodsRequiringBody.includes(req.method)) {
    const ct = req.headers["content-type"] || "";
    const validTypes = ["application/json", "application/x-www-form-urlencoded", "multipart/form-data", "text/plain"];
    const isValid = validTypes.some(t => ct.includes(t));
    if (!isValid && req.headers["content-length"] !== "0") {
      res.status(415).json({ error: "Unsupported Media Type" });
      return;
    }
  }
  next();
}

export function requestSizeLimit(req: Request, res: Response, next: NextFunction) {
  const MAX_BODY_SIZE = 1024 * 1024;
  const contentLength = parseInt(req.headers["content-length"] || "0", 10);
  if (contentLength > MAX_BODY_SIZE) {
    res.status(413).json({ error: "Request entity too large" });
    return;
  }
  next();
}
