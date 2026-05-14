import { pinoHttp } from "pino-http";
import { logger } from "../libs/logger.js";

export const httpLogger = pinoHttp({
  logger,
  customLogLevel: (req, res, err) => {
    const statusCode = res.statusCode ?? 500;

    if (statusCode >= 500 || err) return "error";
    if (statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage: (req, res) => {
    return `Request successful: ${req.method} ${req.url} completed with status ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `Request failed: ${req.method} ${req.url} error with ${res.statusCode} - ${err.message}`;
  }
});
