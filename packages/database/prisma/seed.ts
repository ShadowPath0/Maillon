import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "password123";

const COMPETENCES_POOL = [
  ["Développement web", "React", "TypeScript"],
  ["Design graphique", "Figma", "Branding"],
  ["Rédaction web", "SEO", "Copywriting"],
  ["Motion design", "After Effects"],
  ["Développement mobile", "React Native"],
  ["UX/UI Design", "Figma", "Prototypage"],
  ["Photographie produit"],
  ["Community management", "Réseaux sociaux"],
  ["Développement WordPress", "PHP"],
  ["Traduction", "Anglais", "Espagnol"],
];

async function main() {
  console.log("Nettoyage des données existantes...");
  await prisma.notification.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.missionComment.deleteMany();
  await prisma.briefFile.deleteMany();
  await prisma.brief.deleteMany();
  await prisma.mission.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.adminDocument.deleteMany();
  await prisma.organizationContractor.deleteMany();
  await prisma.contractorProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const motDePasseHash = await argon2.hash(DEMO_PASSWORD);

  console.log("Création des agences...");
  const agences = await Promise.all(
    [
      { nom: "Studio Pixel", adminEmail: "admin@studiopixel.demo", adminNom: "Claire Dubois" },
      { nom: "Créa Nord", adminEmail: "admin@creanord.demo", adminNom: "Julien Marchand" },
      { nom: "Agence Lumière", adminEmail: "admin@agencelumiere.demo", adminNom: "Sophie Bernard" },
    ].map((a) =>
      prisma.organization.create({
        data: {
          nom: a.nom,
          membres: {
            create: [
              { email: a.adminEmail, nom: a.adminNom, motDePasseHash, role: "ADMIN" },
              { email: a.adminEmail.replace("admin@", "membre@"), nom: `${a.adminNom} (membre)`, motDePasseHash, role: "MEMBRE" },
            ],
          },
        },
        include: { membres: true },
      }),
    ),
  );

  console.log("Création des sous-traitants...");
  const contractors = await Promise.all(
    Array.from({ length: 10 }).map((_, i) => {
      const competences = COMPETENCES_POOL[i % COMPETENCES_POOL.length];
      const disponibilites = ["DISPONIBLE", "OCCUPE", "INDISPONIBLE"] as const;
      return prisma.user.create({
        data: {
          email: `freelance${i + 1}@sous-traitant.demo`,
          nom: `Freelance ${i + 1}`,
          motDePasseHash,
          role: "SOUS_TRAITANT",
          contractorProfile: {
            create: {
              competences,
              tarifJour: 250 + i * 30,
              tarifHeure: 35 + i * 4,
              disponibilite: disponibilites[i % disponibilites.length],
              noteMoyenne: 3.5 + (i % 3) * 0.5,
            },
          },
        },
        include: { contractorProfile: true },
      });
    }),
  );

  console.log("Rattachement des sous-traitants aux agences...");
  // Chaque agence travaille avec ~5 sous-traitants, avec chevauchement pour illustrer le multi-agence.
  for (const [orgIndex, org] of agences.entries()) {
    const start = orgIndex * 3;
    const linkedContractors = [
      contractors[start % contractors.length],
      contractors[(start + 1) % contractors.length],
      contractors[(start + 2) % contractors.length],
      contractors[(start + 3) % contractors.length],
      contractors[(start + 4) % contractors.length],
    ];
    for (const contractor of linkedContractors) {
      await prisma.organizationContractor.upsert({
        where: {
          organizationId_contractorProfileId: {
            organizationId: org.id,
            contractorProfileId: contractor.contractorProfile!.id,
          },
        },
        create: { organizationId: org.id, contractorProfileId: contractor.contractorProfile!.id },
        update: {},
      });
    }
  }

  console.log("Ajout de documents administratifs...");
  for (const contractor of contractors.slice(0, 4)) {
    await prisma.adminDocument.create({
      data: {
        contractorProfileId: contractor.contractorProfile!.id,
        type: "ATTESTATION_URSSAF",
        fichierUrl: "/uploads/seed/attestation-urssaf-exemple.pdf",
        dateExpiration: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log("Création des missions...");
  const statuts = ["BRIEF_ENVOYE", "EN_COURS", "LIVRE", "EN_VALIDATION", "VALIDE", "REJETE"] as const;
  const missionTitres = [
    "Refonte du site vitrine",
    "Campagne réseaux sociaux Q3",
    "Identité visuelle nouvelle gamme",
    "Rédaction fiches produits",
    "Vidéo de présentation entreprise",
    "Application mobile fidélité",
    "Landing page campagne promo",
    "Newsletter mensuelle",
    "Shooting photo catalogue",
    "Traduction site EN/ES",
    "Optimisation SEO blog",
    "Design UI dashboard client",
    "Bannières publicitaires display",
    "Refonte logo et charte",
    "Support technique WordPress",
    "Script vidéo produit",
    "Community management mensuel",
    "Prototype application interne",
    "Illustrations pour rapport annuel",
    "Migration site vers nouveau CMS",
  ];

  let contractorCursor = 0;
  for (let i = 0; i < missionTitres.length; i++) {
    const org = agences[i % agences.length];
    const statut = statuts[i % statuts.length];
    const orgContractors = await prisma.organizationContractor.findMany({
      where: { organizationId: org.id },
      include: { contractorProfile: { include: { user: true } } },
    });
    const assigned = orgContractors.length > 0 ? orgContractors[contractorCursor % orgContractors.length] : null;
    contractorCursor++;

    const dateEcheance = new Date(Date.now() + (i - 5) * 3 * 24 * 60 * 60 * 1000);

    const mission = await prisma.mission.create({
      data: {
        organizationId: org.id,
        titre: missionTitres[i],
        sousTraitantId: assigned?.contractorProfile.user.id,
        clientFinal: i % 3 === 0 ? "Client final SA" : null,
        dateDebut: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        dateEcheance,
        statut,
        budgetPrevu: 800 + i * 100,
        tarifConvenu: 600 + i * 80,
        brief: {
          create: {
            contenuTexte: `Brief détaillé pour la mission "${missionTitres[i]}". Merci de respecter la charte graphique et les délais convenus.`,
          },
        },
      },
    });

    if (assigned && (statut === "LIVRE" || statut === "EN_VALIDATION" || statut === "VALIDE" || statut === "REJETE")) {
      await prisma.deliverable.create({
        data: {
          missionId: mission.id,
          version: 1,
          fichierOuLien: "https://drive.example.com/livrable-demo",
          commentaireSousTraitant: "Première version, prête pour relecture.",
          statut: statut === "VALIDE" ? "VALIDE" : statut === "REJETE" ? "REJETE" : "SOUMIS",
          commentaireValidation: statut === "REJETE" ? "Merci de revoir les couleurs utilisées." : null,
        },
      });
    }

    if (assigned && (statut === "EN_COURS" || statut === "LIVRE" || statut === "EN_VALIDATION" || statut === "VALIDE")) {
      await prisma.contract.create({
        data: {
          missionId: mission.id,
          templateUtilise: "standard-v1",
          statut: statut === "VALIDE" ? "SIGNE" : "ENVOYE",
          dateEnvoi: new Date(),
          dateSignature: statut === "VALIDE" ? new Date() : null,
        },
      });
    }

    if (assigned && statut === "VALIDE") {
      const invoiceStatuts = ["RECUE", "A_PAYER", "PAYEE", "EN_RETARD"] as const;
      const invStatut = invoiceStatuts[i % invoiceStatuts.length];
      await prisma.invoice.create({
        data: {
          missionId: mission.id,
          sousTraitantId: assigned.contractorProfile.user.id,
          montant: 600 + i * 80,
          fichierFacture: "/uploads/seed/facture-exemple.pdf",
          statut: invStatut,
          datePaiementPrevue:
            invStatut === "A_PAYER" || invStatut === "PAYEE"
              ? new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
              : invStatut === "EN_RETARD"
                ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
                : null,
          datePaiementReel: invStatut === "PAYEE" ? new Date() : null,
        },
      });
    }
  }

  console.log("\nSeed terminé.");
  console.log("Comptes de démo (mot de passe: password123) :");
  for (const org of agences) {
    console.log(`  - ${org.nom}: ${org.membres[0].email} (admin) / ${org.membres[1].email} (membre)`);
  }
  console.log(`  - Sous-traitants: freelance1@sous-traitant.demo ... freelance10@sous-traitant.demo`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
