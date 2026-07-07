import { IsIn, IsISO8601, IsOptional } from "class-validator";
import { TypeDocumentAdministratif } from "@gst/shared-types";

export class UploadDocumentDto {
  @IsIn([
    TypeDocumentAdministratif.KBIS,
    TypeDocumentAdministratif.ATTESTATION_URSSAF,
    TypeDocumentAdministratif.ATTESTATION_ASSURANCE,
    TypeDocumentAdministratif.RIB,
    TypeDocumentAdministratif.AUTRE,
  ])
  type!: TypeDocumentAdministratif;

  @IsOptional()
  @IsISO8601()
  dateExpiration?: string;
}
