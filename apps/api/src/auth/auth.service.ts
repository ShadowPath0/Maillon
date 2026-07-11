import { randomBytes } from "crypto";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { Role } from "@gst/shared-types";
import type { AuthTokens, AuthenticatedUser } from "@gst/shared-types";
import { RegisterAgencyDto } from "./dto/register-agency.dto";
import { LoginDto } from "./dto/login.dto";
import { InviteMemberDto } from "./dto/invite-member.dto";
import { InviteContractorDto } from "./dto/invite-contractor.dto";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

const INVITATION_TTL_DAYS = 7;
const PASSWORD_RESET_TTL_MINUTES = 60;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
  ) {}

  private toAuthenticatedUser(user: {
    id: string;
    email: string;
    nom: string;
    role: string;
    organizationId: string | null;
  }): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      nom: user.nom,
      role: user.role as AuthenticatedUser["role"],
      organizationId: user.organizationId,
    };
  }

  private issueTokens(user: AuthenticatedUser): AuthTokens {
    const payload = { sub: user.id };
    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET ?? "change-me-access-secret",
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET ?? "change-me-refresh-secret",
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",
    });
    return { accessToken, refreshToken };
  }

  async registerAgency(dto: RegisterAgencyDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("Un compte existe déjà avec cet email.");
    }

    const motDePasseHash = await argon2.hash(dto.motDePasse);

    const organization = await this.prisma.organization.create({
      data: {
        nom: dto.nomAgence,
        membres: {
          create: {
            email: dto.email,
            nom: dto.nom,
            motDePasseHash,
            role: Role.ADMIN,
          },
        },
      },
      include: { membres: true },
    });

    const user = organization.membres[0];
    const authUser = this.toAuthenticatedUser(user);
    return { user: authUser, tokens: this.issueTokens(authUser) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || user.deletedAt) {
      throw new UnauthorizedException("Identifiants invalides.");
    }
    const valid = await argon2.verify(user.motDePasseHash, dto.motDePasse);
    if (!valid) {
      throw new UnauthorizedException("Identifiants invalides.");
    }
    const authUser = this.toAuthenticatedUser(user);
    return { user: authUser, tokens: this.issueTokens(authUser) };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? "change-me-refresh-secret",
      });
    } catch {
      throw new UnauthorizedException("Refresh token invalide ou expiré.");
    }
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.deletedAt) {
      throw new UnauthorizedException();
    }
    const authUser = this.toAuthenticatedUser(user);
    return { user: authUser, tokens: this.issueTokens(authUser) };
  }

  async me(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException();
    }
    return this.toAuthenticatedUser(user);
  }

  async inviteMember(organizationId: string, dto: InviteMemberDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new ConflictException("Un compte existe déjà avec cet email.");
    }

    const token = randomBytes(32).toString("hex");
    const invitation = await this.prisma.invitation.create({
      data: {
        organizationId,
        email: dto.email,
        role: dto.role,
        token,
        expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    const link = `${process.env.WEB_URL ?? "http://localhost:3000"}/invitations/${token}`;
    await this.email.send(
      dto.email,
      "Invitation à rejoindre votre agence",
      `<p>Vous avez été invité(e) à rejoindre une agence. <a href="${link}">Cliquez ici pour créer votre compte</a>.</p>`,
    );

    return invitation;
  }

  async inviteContractor(organizationId: string, dto: InviteContractorDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { contractorProfile: true },
    });

    if (existingUser && existingUser.role !== Role.SOUS_TRAITANT) {
      throw new ConflictException("Cet email est déjà utilisé par un compte agence.");
    }

    if (existingUser?.contractorProfile) {
      await this.prisma.organizationContractor.upsert({
        where: {
          organizationId_contractorProfileId: {
            organizationId,
            contractorProfileId: existingUser.contractorProfile.id,
          },
        },
        create: { organizationId, contractorProfileId: existingUser.contractorProfile.id },
        update: {},
      });
      await this.email.send(
        dto.email,
        "Vous avez été ajouté à l'annuaire d'une agence",
        `<p>Une agence vous a ajouté à son annuaire de sous-traitants. Connectez-vous avec votre compte existant pour voir vos missions.</p>`,
      );
      return { linkedExisting: true };
    }

    const token = randomBytes(32).toString("hex");
    const invitation = await this.prisma.invitation.create({
      data: {
        organizationId,
        email: dto.email,
        role: Role.SOUS_TRAITANT,
        token,
        expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    const link = `${process.env.WEB_URL ?? "http://localhost:3000"}/invitations/${token}`;
    await this.email.send(
      dto.email,
      "Invitation à rejoindre le portail sous-traitant",
      `<p>Une agence souhaite collaborer avec vous. <a href="${link}">Cliquez ici pour créer votre compte</a>.</p>`,
    );

    return invitation;
  }

  async acceptInvitation(dto: AcceptInvitationDto) {
    const invitation = await this.prisma.invitation.findUnique({ where: { token: dto.token } });
    if (!invitation) {
      throw new NotFoundException("Invitation introuvable.");
    }
    if (invitation.acceptedAt) {
      throw new BadRequestException("Cette invitation a déjà été utilisée.");
    }
    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException("Cette invitation a expiré.");
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: invitation.email },
      include: { contractorProfile: true },
    });

    if (existingUser) {
      // Ne jamais modifier le mot de passe d'un compte existant via une invitation :
      // on se contente de rattacher l'agence si c'est un sous-traitant.
      if (existingUser.role === Role.SOUS_TRAITANT && existingUser.contractorProfile) {
        await this.prisma.organizationContractor.upsert({
          where: {
            organizationId_contractorProfileId: {
              organizationId: invitation.organizationId,
              contractorProfileId: existingUser.contractorProfile.id,
            },
          },
          create: {
            organizationId: invitation.organizationId,
            contractorProfileId: existingUser.contractorProfile.id,
          },
          update: {},
        });
        await this.prisma.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
        return { message: "Compte existant rattaché à l'agence. Connectez-vous avec vos identifiants habituels." };
      }
      throw new ConflictException("Un compte existe déjà avec cet email.");
    }

    const motDePasseHash = await argon2.hash(dto.motDePasse);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: invitation.email,
          nom: dto.nom,
          motDePasseHash,
          role: invitation.role,
          organizationId: invitation.role === Role.SOUS_TRAITANT ? null : invitation.organizationId,
        },
      });

      if (invitation.role === Role.SOUS_TRAITANT) {
        const profile = await tx.contractorProfile.create({
          data: { userId: created.id },
        });
        await tx.organizationContractor.create({
          data: { organizationId: invitation.organizationId, contractorProfileId: profile.id },
        });
      }

      await tx.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
      return created;
    });

    const authUser = this.toAuthenticatedUser(user);
    return { user: authUser, tokens: this.issueTokens(authUser) };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // Toujours la même réponse, que le compte existe ou non : on ne révèle jamais
    // si un email est enregistré (évite l'énumération de comptes).
    const genericResponse = {
      message: "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.",
    };
    if (!user || user.deletedAt) {
      return genericResponse;
    }

    const token = randomBytes(32).toString("hex");
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000),
      },
    });

    const link = `${process.env.WEB_URL ?? "http://localhost:3000"}/reinitialiser-mot-de-passe/${token}`;
    await this.email.send(
      user.email,
      "Réinitialisation de votre mot de passe",
      `<p>Vous avez demandé la réinitialisation de votre mot de passe. <a href="${link}">Cliquez ici pour en choisir un nouveau</a>. Ce lien expire dans une heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
    );

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({ where: { token: dto.token } });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new BadRequestException("Ce lien de réinitialisation est invalide ou a expiré.");
    }

    const motDePasseHash = await argon2.hash(dto.motDePasse);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: resetToken.userId }, data: { motDePasseHash } }),
      this.prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    ]);

    return { message: "Mot de passe mis à jour. Vous pouvez vous connecter." };
  }
}
