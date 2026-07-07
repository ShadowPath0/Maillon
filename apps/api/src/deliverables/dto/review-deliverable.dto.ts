import { IsOptional, IsString } from "class-validator";

export class ReviewDeliverableDto {
  @IsOptional()
  @IsString()
  commentaireValidation?: string;
}
