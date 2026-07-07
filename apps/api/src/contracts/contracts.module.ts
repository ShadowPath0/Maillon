import { Module } from "@nestjs/common";
import { ContractsController } from "./contracts.controller";
import { ContractsService } from "./contracts.service";
import { ContractsPdfService } from "./contracts-pdf.service";

@Module({
  controllers: [ContractsController],
  providers: [ContractsService, ContractsPdfService],
  exports: [ContractsService],
})
export class ContractsModule {}
