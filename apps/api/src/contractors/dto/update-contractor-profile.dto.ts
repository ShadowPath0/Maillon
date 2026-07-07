import { IsArray, IsIn, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { Disponibilite } from "@gst/shared-types";

export class UpdateContractorProfileDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  competences?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  tarifJour?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tarifHeure?: number;

  @IsOptional()
  @IsIn([Disponibilite.DISPONIBLE, Disponibilite.OCCUPE, Disponibilite.INDISPONIBLE])
  disponibilite?: Disponibilite;
}
