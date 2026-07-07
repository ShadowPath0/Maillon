import { z } from "zod";
import { Role } from "./enums";

export const registerAgencySchema = z.object({
  nomAgence: z.string().min(2),
  nom: z.string().min(2),
  email: z.string().email(),
  motDePasse: z.string().min(8),
});
export type RegisterAgencyDto = z.infer<typeof registerAgencySchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  motDePasse: z.string().min(1),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
  nom: z.string().min(2),
  motDePasse: z.string().min(8),
});
export type AcceptInvitationDto = z.infer<typeof acceptInvitationSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum([Role.ADMIN, Role.MEMBRE]),
});
export type InviteMemberDto = z.infer<typeof inviteMemberSchema>;

export const inviteContractorSchema = z.object({
  email: z.string().email(),
  nom: z.string().min(2).optional(),
});
export type InviteContractorDto = z.infer<typeof inviteContractorSchema>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  nom: string;
  role: Role;
  organizationId: string | null;
}
