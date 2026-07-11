import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { MissionsService } from "./missions.service";
import { Role } from "@gst/shared-types";
import type { AuthenticatedUser } from "@gst/shared-types";

function buildPrismaMock() {
  return {
    mission: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
  };
}

function buildService(prisma: ReturnType<typeof buildPrismaMock>) {
  return new MissionsService(prisma as any, {} as any, {} as any);
}

function buildUser(overrides: Partial<AuthenticatedUser>): AuthenticatedUser {
  return {
    id: "user-1",
    email: "user@test.fr",
    nom: "Test",
    role: Role.ADMIN,
    organizationId: "org-1",
    ...overrides,
  };
}

describe("MissionsService — isolation multi-tenant", () => {
  describe("getDetail", () => {
    it("refuse l'accès à une mission d'une autre agence", async () => {
      const prisma = buildPrismaMock();
      prisma.mission.findUnique.mockResolvedValue({
        id: "mission-1",
        organizationId: "org-2",
        sousTraitantId: null,
      });
      const service = buildService(prisma);
      const currentUser = buildUser({ role: Role.ADMIN, organizationId: "org-1" });

      await expect(service.getDetail(currentUser, "mission-1")).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("refuse l'accès à un sous-traitant sur une mission qui ne lui est pas assignée", async () => {
      const prisma = buildPrismaMock();
      prisma.mission.findUnique.mockResolvedValue({
        id: "mission-1",
        organizationId: "org-1",
        sousTraitantId: "autre-sous-traitant",
      });
      const service = buildService(prisma);
      const currentUser = buildUser({ id: "user-2", role: Role.SOUS_TRAITANT, organizationId: null });

      await expect(service.getDetail(currentUser, "mission-1")).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("lève une NotFoundException si la mission n'existe pas", async () => {
      const prisma = buildPrismaMock();
      prisma.mission.findUnique.mockResolvedValue(null);
      const service = buildService(prisma);
      const currentUser = buildUser({});

      await expect(service.getDetail(currentUser, "mission-inconnue")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("autorise l'accès à une mission de sa propre agence", async () => {
      const prisma = buildPrismaMock();
      const mission = { id: "mission-1", organizationId: "org-1", sousTraitantId: null };
      prisma.mission.findUnique.mockResolvedValue(mission);
      const service = buildService(prisma);
      const currentUser = buildUser({ role: Role.ADMIN, organizationId: "org-1" });

      await expect(service.getDetail(currentUser, "mission-1")).resolves.toEqual(mission);
    });
  });

  describe("list", () => {
    it("filtre par organizationId pour un membre d'agence et retourne une réponse paginée", async () => {
      const prisma = buildPrismaMock();
      prisma.mission.findMany.mockResolvedValue([{ id: "mission-1" }]);
      prisma.mission.count.mockResolvedValue(1);
      const service = buildService(prisma);
      const currentUser = buildUser({ role: Role.ADMIN, organizationId: "org-1" });

      const result = await service.list(currentUser, {});

      expect(prisma.mission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ organizationId: "org-1" }) }),
      );
      expect(result).toEqual({
        data: [{ id: "mission-1" }],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      });
    });

    it("filtre par sousTraitantId pour un sous-traitant, jamais par organizationId", async () => {
      const prisma = buildPrismaMock();
      const service = buildService(prisma);
      const currentUser = buildUser({ id: "st-1", role: Role.SOUS_TRAITANT, organizationId: null });

      await service.list(currentUser, {});

      const call = prisma.mission.findMany.mock.calls[0][0];
      expect(call.where).toEqual({ sousTraitantId: "st-1", statut: undefined });
    });
  });
});
