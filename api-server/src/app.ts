import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { applySecurityHeaders } from "./middlewares/security-headers";
import { globalRateLimiter } from "./middlewares/rate-limiter";
import { threatDetector } from "./middlewares/threat-detector";
import { sessionHardener, validateContentType, requestSizeLimit } from "./middlewares/session-hardener";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

applySecurityHeaders(app);

app.use(sessionHardener);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = [
        /^https?:\/\/localhost(:\d+)?$/,
        /\.replit\.app$/,
        /\.replit\.dev$/,
        /\.repl\.co$/,
      ];
      const ok = allowed.some(r => r.test(origin));
      callback(ok ? null : new Error("Not allowed by CORS"), ok);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["X-Request-Id", "RateLimit-Limit", "RateLimit-Remaining"],
  }),
);

app.use(globalRateLimiter);

app.use(requestSizeLimit);
app.use(validateContentType);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(threatDetector);

app.use("/api", router);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

export default app;
