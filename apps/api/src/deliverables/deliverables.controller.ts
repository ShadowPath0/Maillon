import { Body, Controller, Get, Param, Patch, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UPLOAD_MULTER_OPTIONS } from "../common/upload.config";
import { DeliverablesService } from "./deliverables.service";
import { SubmitDeliverableDto } from "./dto/submit-deliverable.dto";
import { ReviewDeliverableDto } from "./dto/review-deliverable.dto";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "@gst/shared-types";
import { Role } from "@gst/shared-types";

@Controller()
export class DeliverablesController {
  constructor(private readonly deliverablesService: DeliverablesService) {}

  @Get("missions/:missionId/livrables")
  listForMission(@CurrentUser() user: AuthenticatedUser, @Param("missionId") missionId: string) {
    return this.deliverablesService.listForMission(user, missionId);
  }

  @Roles(Role.SOUS_TRAITANT)
  @Post("missions/:missionId/livrables")
  @UseInterceptors(FileInterceptor("file", UPLOAD_MULTER_OPTIONS))
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param("missionId") missionId: string,
    @Body() dto: SubmitDeliverableDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.deliverablesService.submit(user, missionId, dto, file);
  }

  @Roles(Role.ADMIN, Role.MEMBRE)
  @Patch("livrables/:id/valider")
  validate(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: ReviewDeliverableDto) {
    return this.deliverablesService.validate(user, id, dto);
  }

  @Roles(Role.ADMIN, Role.MEMBRE)
  @Patch("livrables/:id/rejeter")
  reject(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: ReviewDeliverableDto) {
    return this.deliverablesService.reject(user, id, dto);
  }
}
