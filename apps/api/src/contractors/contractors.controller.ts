import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ContractorsService } from "./contractors.service";
import { UpdateContractorProfileDto } from "./dto/update-contractor-profile.dto";
import { UploadDocumentDto } from "./dto/upload-document.dto";
import { ListContractorsQueryDto } from "./dto/list-contractors-query.dto";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "@gst/shared-types";
import { Role } from "@gst/shared-types";

@Controller("sous-traitants")
export class ContractorsController {
  constructor(private readonly contractorsService: ContractorsService) {}

  @Roles(Role.ADMIN, Role.MEMBRE)
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListContractorsQueryDto) {
    return this.contractorsService.listForOrganization(user.organizationId!, query);
  }

  @Roles(Role.SOUS_TRAITANT)
  @Get("me")
  getOwnProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.contractorsService.getOwnProfile(user.id);
  }

  @Roles(Role.SOUS_TRAITANT)
  @Patch("me")
  updateOwnProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateContractorProfileDto) {
    return this.contractorsService.updateOwnProfile(user.id, dto);
  }

  @Roles(Role.SOUS_TRAITANT)
  @Post("me/documents")
  @UseInterceptors(FileInterceptor("file"))
  uploadOwnDocument(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.contractorsService.uploadOwnDocument(user.id, file, dto);
  }

  @Roles(Role.SOUS_TRAITANT)
  @Delete("me/documents/:id")
  deleteOwnDocument(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.contractorsService.deleteOwnDocument(user.id, id);
  }

  @Roles(Role.ADMIN, Role.MEMBRE)
  @Get(":id")
  getDetail(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.contractorsService.getDetailForOrganization(user.organizationId!, id);
  }
}
