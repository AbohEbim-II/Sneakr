// auth/token.type.ts

import type { Role } from "@/generated/prisma/index.js";

export interface TokenPayload {
  id: string;
  role: string;
  type: Role;
  jti?: string;
  userId?: string;
}
