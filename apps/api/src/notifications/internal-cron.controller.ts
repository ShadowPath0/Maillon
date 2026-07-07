import { Controller, ForbiddenException, Headers, Post } from "@nestjs/common";
import { Public } from "../auth/decorators/public.decorator";
import { NotificationsScheduler } from "./notifications.scheduler";

@Controller("internal/cron")
export class InternalCronController {
  constructor(private readonly scheduler: NotificationsScheduler) {}

  @Public()
  @Post("run")
  async run(@Headers("x-cron-secret") secret: string | undefined) {
    const expected = process.env.CRON_SECRET;
    if (!expected || secret !== expected) {
      throw new ForbiddenException("Secret de cron invalide.");
    }
    await this.scheduler.checkExpiringDocuments();
    await this.scheduler.checkOverdueInvoices();
    return { message: "Vérifications exécutées." };
  }
}
