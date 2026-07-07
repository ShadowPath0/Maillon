import { IsNumber, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateInvoiceDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montant!: number;
}
