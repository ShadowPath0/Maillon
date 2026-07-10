import { Module } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { StripeService } from "./stripe.service";

@Module({
  controllers: [BillingController],
  providers: [StripeService],
})
export class BillingModule {}
