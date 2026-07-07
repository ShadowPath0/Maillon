import { Body, Controller, Get, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterAgencyDto } from "./dto/register-agency.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { InviteMemberDto } from "./dto/invite-member.dto";
import { InviteContractorDto } from "./dto/invite-contractor.dto";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto";
import { Public } from "./decorators/public.decorator";
import { Roles } from "./decorators/roles.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import type { AuthenticatedUser } from "@gst/shared-types";
import { Role } from "@gst/shared-types";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register-agency")
  registerAgency(@Body() dto: RegisterAgencyDto) {
    return this.authService.registerAgency(dto);
  }

  @Public()
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post("refresh")
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post("accept-invitation")
  acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.authService.acceptInvitation(dto);
  }

  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.id);
  }

  @Roles(Role.ADMIN)
  @Post("invite-member")
  inviteMember(@CurrentUser() user: AuthenticatedUser, @Body() dto: InviteMemberDto) {
    return this.authService.inviteMember(user.organizationId!, dto);
  }

  @Roles(Role.ADMIN, Role.MEMBRE)
  @Post("invite-contractor")
  inviteContractor(@CurrentUser() user: AuthenticatedUser, @Body() dto: InviteContractorDto) {
    return this.authService.inviteContractor(user.organizationId!, dto);
  }
}
