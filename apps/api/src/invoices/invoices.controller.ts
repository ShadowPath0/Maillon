import { Body, Controller, Get, Param, Patch, Post, Query, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { InvoicesService } from "./invoices.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { MarkToPayDto } from "./dto/mark-to-pay.dto";
import { ListInvoicesQueryDto } from "./dto/list-invoices-query.dto";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "@gst/shared-types";
import { Role } from "@gst/shared-types";

@Controller()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Roles(Role.SOUS_TRAITANT)
  @Post("missions/:missionId/factures")
  @UseInterceptors(FileInterceptor("file"))
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param("missionId") missionId: string,
    @Body() dto: CreateInvoiceDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.invoicesService.create(user, missionId, dto, file);
  }

  @Get("factures")
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListInvoicesQueryDto) {
    return this.invoicesService.list(user, query);
  }

  @Roles(Role.ADMIN, Role.MEMBRE)
  @Get("factures/export.csv")
  async exportCsv(@CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const csv = await this.invoicesService.exportCsv(user);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=factures.csv");
    res.send(csv);
  }

  @Get("factures/:id")
  getDetail(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.invoicesService.getDetail(user, id);
  }

  @Roles(Role.ADMIN, Role.MEMBRE)
  @Patch("factures/:id/a-payer")
  markToPay(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: MarkToPayDto) {
    return this.invoicesService.markToPay(user, id, dto);
  }

  @Roles(Role.ADMIN, Role.MEMBRE)
  @Patch("factures/:id/payee")
  markPaid(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.invoicesService.markPaid(user, id);
  }
}
