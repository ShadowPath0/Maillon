import { PlanAbonnement } from "@gst/shared-types";

export interface PricingPlan {
  id: typeof PlanAbonnement.STARTER | typeof PlanAbonnement.PRO;
  name: string;
  price: number;
  tagline: string;
  features: string[];
  highlighted?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: PlanAbonnement.STARTER,
    name: "Starter",
    price: 29,
    tagline: "Pour une agence qui démarre avec quelques freelances réguliers.",
    features: [
      "Jusqu'à 5 sous-traitants actifs",
      "1 membre d'agence",
      "Missions, contrats, livrables, factures illimités",
      "Portail sous-traitant inclus",
      "Export CSV des factures",
    ],
  },
  {
    id: PlanAbonnement.PRO,
    name: "Pro",
    price: 79,
    tagline: "Pour une agence qui gère un pool de freelances au quotidien.",
    highlighted: true,
    features: [
      "Sous-traitants illimités",
      "Membres d'agence illimités",
      "Tout Starter",
      "Tableau de bord avec graphiques",
      "Alertes automatiques (factures en retard, documents qui expirent)",
      "Support prioritaire",
    ],
  },
];
