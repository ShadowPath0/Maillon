import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { UPLOAD_MULTER_OPTIONS } from "../common/upload.config";
import { MissionsService } from "./missions.service";
import { CreateMissionDto } from "./dto/create-mission.dto";
import { UpdateMissionDto } from "./dto/update-mission.dto";
import { ListMissionsQueryDto } from "./dto/list-missions-query.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "@gst/shared-types";
import { Role } from "@gst/shared-types";

@Controller("missions")
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Roles(Role.ADMIN, Role.MEMBRE)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMissionDto) {
    return this.missionsService.create(user, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListMissionsQueryDto) {
    return this.missionsService.list(user, query);
  }

  @Get(":id")
  getDetail(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.missionsService.getDetail(user, id);
  }

  @Roles(Role.ADMIN, Role.MEMBRE)
  @Patch(":id")
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateMissionDto) {
    return this.missionsService.update(user, id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.missionsService.delete(user, id);
  }

  @Roles(Role.ADMIN, Role.MEMBRE)
  @Post(":id/brief/files")
  @UseInterceptors(FilesInterceptor("files", 10, UPLOAD_MULTER_OPTIONS))
  addBriefFiles(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.missionsService.addBriefFiles(user, id, files);
  }

  @Post(":id/comments")
  addComment(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: CreateCommentDto) {
    return this.missionsService.addComment(user, id, dto);
  }
}
