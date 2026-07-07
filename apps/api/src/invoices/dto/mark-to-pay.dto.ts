import { IsISO8601 } from "class-validator";

export class MarkToPayDto {
  @IsISO8601()
  datePaiementPrevue!: string;
}
