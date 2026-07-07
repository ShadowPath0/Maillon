import { IsEmail, IsIn } from "class-validator";
import { Role } from "@gst/shared-types";

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsIn([Role.ADMIN, Role.MEMBRE])
  role!: typeof Role.ADMIN | typeof Role.MEMBRE;
}
