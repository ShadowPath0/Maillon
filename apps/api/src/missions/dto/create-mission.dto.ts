import { IsISO8601, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from "class-validator";

export class CreateMissionDto {
  @IsString()
  @MinLength(2)
  titre!: string;

  @IsOptional()
  @IsString()
  briefTexte?: string;

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
}
