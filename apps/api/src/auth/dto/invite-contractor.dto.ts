import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class InviteContractorDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  nom?: string;
}
