import { Global, Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { InternalCronController } from "./internal-cron.controller";
import { NotificationsService } from "./notifications.service";
import { NotificationsScheduler } from "./notifications.scheduler";

@Global()
@Module({
  controllers: [NotificationsController, InternalCronController],
  providers: [NotificationsService, NotificationsScheduler],
  exports: [NotificationsService],
})
export class NotificationsModule {}
