import { IsIn, IsOptional, IsUUID } from "class-validator";
import { StatutFacture } from "@gst/shared-types";
import { PaginationQueryDto } from "../../common/pagination";

export class ListInvoicesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn([StatutFacture.RECUE, StatutFacture.A_PAYER, StatutFacture.PAYEE, StatutFacture.EN_RETARD])
  statut?: StatutFacture;

  @IsOptional()
  @IsUUID()
  sousTraitantId?: string;

  @IsOptional()
  @IsUUID()
  missionId?: string;
}
