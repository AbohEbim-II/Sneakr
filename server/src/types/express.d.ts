// src/types/express.d.ts
import type { TokenPayload } from "@/modules/auth/token.types.js";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}