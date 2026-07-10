import { IsIn } from "class-validator";
import { PlanAbonnement } from "@gst/shared-types";

export class CreateCheckoutDto {
  @IsIn([PlanAbonnement.STARTER, PlanAbonnement.PRO])
  plan!: typeof PlanAbonnement.STARTER | typeof PlanAbonnement.PRO;
}
