import { Role } from "@prisma/client";

// ─── Authenticated principal variants ────────────────────────────────────────

export type AuthenticatedUser = {
    type: "USER";
    id: string;
    role: Role;
};

export type AuthenticatedAdmin = {
    type: "ADMIN";
    id: string;
    role: Role;
};

export type AuthenticatedSuperAdmin = {
    type: "SUPER_ADMIN";
    id: string;
    role: Role;
};

/** Union of every principal type that can be attached to a request. */
export type AuthenticatedPrincipal =
    | AuthenticatedUser
    | AuthenticatedAdmin
    | AuthenticatedSuperAdmin;

// ─── Express augmentation ─────────────────────────────────────────────────────

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedPrincipal;
            jti?: string;
        }
    }
}