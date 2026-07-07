import { IsString, MinLength } from "class-validator";

export class AcceptInvitationDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsString()
  @MinLength(2)
  nom!: string;

  @IsString()
  @MinLength(8)
  motDePasse!: string;
}
