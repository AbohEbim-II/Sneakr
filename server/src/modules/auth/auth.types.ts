import type { Role } from "@/generated/prisma/index.js";



export interface UserResponseDTO {
  id: string;
  name: string | null;
  email: string ;
  phoneNumber: string | null;
  role: Role;
}