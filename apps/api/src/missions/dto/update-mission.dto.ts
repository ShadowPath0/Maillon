import { IsIn, IsISO8601, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from "class-validator";
import { StatutMission } from "@gst/shared-types";

export class UpdateMissionDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  titre?: string;

  @IsOptional()
  @IsUUID()
  sousTraitantId?: string;

  @IsOptional()
  @IsString()
  clientFinal?: string;

  @IsOptional()
  @IsISO8601()
  dateDebut?: string;

  @IsOptional()
  @IsISO8601()
  dateEcheance?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetPrevu?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tarifConvenu?: number;

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
}
