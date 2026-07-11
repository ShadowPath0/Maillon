import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";
import { EmailModule } from "./email/email.module";
import { StorageModule } from "./storage/storage.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { ContractorsModule } from "./contractors/contractors.module";
import { MissionsModule } from "./missions/missions.module";
import { ContractsModule } from "./contracts/contracts.module";
import { DeliverablesModule } from "./deliverables/deliverables.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { BillingModule } from "./billing/billing.module";
import { SupportModule } from "./support/support.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { RolesGuard } from "./auth/guards/roles.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ name: "default", ttl: 60000, limit: 60 }]),
    PrismaModule,
    EmailModule,
    StorageModule,
    AuthModule,
    UsersModule,
    NotificationsModule,
    ContractorsModule,
    MissionsModule,
    ContractsModule,
    DeliverablesModule,
    InvoicesModule,
    DashboardModule,
    BillingModule,
    SupportModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
