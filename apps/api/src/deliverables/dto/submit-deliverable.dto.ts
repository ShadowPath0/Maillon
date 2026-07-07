import { IsOptional, IsString, IsUrl } from "class-validator";

export class SubmitDeliverableDto {
  @IsOptional()
  @IsUrl({ require_protocol: true })
  lien?: string;

  @IsOptional()
  @IsString()
  commentaireSousTraitant?: string;
}
