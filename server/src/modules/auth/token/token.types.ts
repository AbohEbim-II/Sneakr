// auth/token.type.ts
export type UserType = "User" | "Admin";

export interface TokenPayload {
  sub: string;
  role: string;
  type: UserType;
  jti?: string;
  userId?: string; 
}
