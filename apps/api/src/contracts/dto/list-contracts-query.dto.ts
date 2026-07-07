import { IsOptional, IsUUID } from "class-validator";

export class ListContractsQueryDto {
  @IsOptional()
  @IsUUID()
  sousTraitantId?: string;

  @IsOptional()
  @IsUUID()
  missionId?: string;
}
