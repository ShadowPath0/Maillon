import { Body, Controller, ForbiddenException, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { SupportService } from "./support.service";
import { CreateSupportMessageDto } from "./dto/create-support-message.dto";
import { Public } from "../auth/decorators/public.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "@gst/shared-types";

@Controller("support")
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSupportMessageDto) {
    return this.support.create(user, dto.message);
  }

  @Public()
  @Get()
  list(@Headers("x-support-secret") secret: string | undefined) {
    this.assertSecret(secret);
    return this.support.listAll();
  }

  @Public()
  @Patch(":id/traiter")
  markTraite(@Headers("x-support-secret") secret: string | undefined, @Param("id") id: string) {
    this.assertSecret(secret);
    return this.support.markTraite(id);
  }

  private assertSecret(secret: string | undefined) {
    const expected = process.env.SUPPORT_ADMIN_SECRET;
    if (!expected || secret !== expected) {
      throw new ForbiddenException("Secret invalide.");
    }
  }
}
