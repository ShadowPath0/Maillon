import { ConflictException, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { AuthService } from "./auth.service";
import { Role } from "@gst/shared-types";

function buildPrismaMock() {
  return {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organization: {
      create: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

function buildService(prisma: ReturnType<typeof buildPrismaMock>) {
  const jwt = new JwtService({ secret: "test-secret" });
  const email = { send: jest.fn().mockResolvedValue(undefined) };
  return new AuthService(prisma as any, jwt, email as any);
}

describe("AuthService", () => {
  describe("registerAgency", () => {
    it("crée une agence et un compte admin quand l'email est libre", async () => {
      const prisma = buildPrismaMock();
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.organization.create.mockResolvedValue({
        id: "org-1",
        membres: [
          { id: "user-1", email: "agence@test.fr", nom: "Alice", role: Role.ADMIN, organizationId: "org-1" },
        ],
      });
      const service = buildService(prisma);

      const result = await service.registerAgency({
        nomAgence: "Mon Agence",
        nom: "Alice",
        email: "agence@test.fr",
        motDePasse: "motdepasse123",
      });

      expect(result.user.role).toBe(Role.ADMIN);
      expect(result.tokens.accessToken).toBeTruthy();
      expect(result.tokens.refreshToken).toBeTruthy();
    });

    it("rejette l'inscription si l'email est déjà utilisé", async () => {
      const prisma = buildPrismaMock();
      prisma.user.findUnique.mockResolvedValue({ id: "existing" });
      const service = buildService(prisma);

      await expect(
        service.registerAgency({
          nomAgence: "Mon Agence",
          nom: "Alice",
          email: "agence@test.fr",
          motDePasse: "motdepasse123",
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("login", () => {
    it("refuse un mot de passe incorrect", async () => {
      const prisma = buildPrismaMock();
      const motDePasseHash = await argon2.hash("bon-mot-de-passe");
      prisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "agence@test.fr",
        nom: "Alice",
        role: Role.ADMIN,
        organizationId: "org-1",
        motDePasseHash,
        deletedAt: null,
      });
      const service = buildService(prisma);

      await expect(service.login({ email: "agence@test.fr", motDePasse: "mauvais" })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("refuse la connexion d'un compte supprimé (RGPD)", async () => {
      const prisma = buildPrismaMock();
      prisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "agence@test.fr",
        motDePasseHash: await argon2.hash("motdepasse123"),
        deletedAt: new Date(),
      });
      const service = buildService(prisma);

      await expect(
        service.login({ email: "agence@test.fr", motDePasse: "motdepasse123" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("connecte l'utilisateur avec les bons identifiants", async () => {
      const prisma = buildPrismaMock();
      const motDePasseHash = await argon2.hash("motdepasse123");
      prisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "agence@test.fr",
        nom: "Alice",
        role: Role.ADMIN,
        organizationId: "org-1",
        motDePasseHash,
        deletedAt: null,
      });
      const service = buildService(prisma);

      const result = await service.login({ email: "agence@test.fr", motDePasse: "motdepasse123" });
      expect(result.user.email).toBe("agence@test.fr");
      expect(result.tokens.accessToken).toBeTruthy();
    });
  });

  describe("forgotPassword", () => {
    it("renvoie le même message générique, que le compte existe ou non (anti-enumeration)", async () => {
      const prisma = buildPrismaMock();
      const service = buildService(prisma);

      prisma.user.findUnique.mockResolvedValueOnce(null);
      const responseUnknown = await service.forgotPassword({ email: "inconnu@test.fr" });

      prisma.user.findUnique.mockResolvedValueOnce({ id: "user-1", email: "connu@test.fr", deletedAt: null });
      prisma.passwordResetToken.create.mockResolvedValue({});
      const responseKnown = await service.forgotPassword({ email: "connu@test.fr" });

      expect(responseUnknown.message).toBe(responseKnown.message);
      expect(prisma.passwordResetToken.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("resetPassword", () => {
    it("rejette un token expiré", async () => {
      const prisma = buildPrismaMock();
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: "token-1",
        userId: "user-1",
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      });
      const service = buildService(prisma);

      await expect(service.resetPassword({ token: "abc", motDePasse: "nouveau123" })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("rejette un token déjà utilisé", async () => {
      const prisma = buildPrismaMock();
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: "token-1",
        userId: "user-1",
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      });
      const service = buildService(prisma);

      await expect(service.resetPassword({ token: "abc", motDePasse: "nouveau123" })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
