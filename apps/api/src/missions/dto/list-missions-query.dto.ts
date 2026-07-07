import { IsIn, IsOptional, IsUUID } from "class-validator";
import { StatutMission } from "@gst/shared-types";

export class ListMissionsQueryDto {
  @IsOptional()
  @IsIn([
    StatutMission.BRIEF_ENVOYE,
    StatutMission.EN_COURS,
    StatutMission.LIVRE,
    StatutMission.EN_VALIDATION,
    StatutMission.VALIDE,
    StatutMission.REJETE,
  ])
  statut?: StatutMission;

  @IsOptional()
  @IsUUID()
  sousTraitantId?: string;
}
