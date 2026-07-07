import { IsIn, IsNumberString, IsOptional, IsString } from "class-validator";
import { Disponibilite } from "@gst/shared-types";

export class ListContractorsQueryDto {
  @IsOptional()
  @IsString()
  competence?: string;

  @IsOptional()
  @IsIn([Disponibilite.DISPONIBLE, Disponibilite.OCCUPE, Disponibilite.INDISPONIBLE])
  disponibilite?: Disponibilite;

  @IsOptional()
  @IsNumberString()
  tarifJourMax?: string;
}
