import { IsIn, IsNumberString, IsOptional, IsString } from "class-validator";
import { Disponibilite } from "@gst/shared-types";
import { PaginationQueryDto } from "../../common/pagination";

export class ListContractorsQueryDto extends PaginationQueryDto {
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
