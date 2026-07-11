import { Body, Controller, Delete, Get, Param, Patch } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "@gst/shared-types";
import { Role } from "@gst/shared-types";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.ADMIN, Role.MEMBRE)
  @Get("members")
  listMembers(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.listMembers(user.organizationId!);
  }

  @Roles(Role.ADMIN)
  @Delete("members/:id")
  deactivateMember(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.usersService.deactivateMember(user, id);
  }

  @Patch("me")
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Delete("me")
  deleteOwnAccount(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.deleteOwnAccount(user);
  }
}
