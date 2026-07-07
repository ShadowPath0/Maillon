import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterAgencyDto {
  @IsString()
  @MinLength(2)
  nomAgence!: string;

  @IsString()
  @MinLength(2)
  nom!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  motDePasse!: string;
}
