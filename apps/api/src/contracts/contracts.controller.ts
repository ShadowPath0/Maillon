import { Controller, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ContractsService } from "./contracts.service";
import { ListContractsQueryDto } from "./dto/list-contracts-query.dto";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "@gst/shared-types";
import { Role } from "@gst/shared-types";

@Controller("contrats")
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Roles(Role.ADMIN, Role.MEMBRE)
  @Post("missions/:missionId")
  createForMission(@CurrentUser() user: AuthenticatedUser, @Param("missionId") missionId: string) {
    return this.contractsService.createForMission(user, missionId);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListContractsQueryDto) {
    return this.contractsService.list(user, query);
  }

  @Get(":id")
  getDetail(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.contractsService.getDetail(user, id);
  }

  @Roles(Role.ADMIN, Role.MEMBRE)
  @Patch(":id/send")
  markSent(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.contractsService.markSent(user, id);
  }

  @Post(":id/signed")
  @UseInterceptors(FileInterceptor("file"))
  uploadSigned(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.contractsService.uploadSigned(user, id, file);
  }
}
