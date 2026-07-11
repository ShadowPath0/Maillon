import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = process.env.EMAIL_FROM ?? "notifications@example.com";
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      this.logger.log(`[email désactivé, RESEND_API_KEY absent] À: ${to} — ${subject}`);
      return;
    }
    // Le SDK Resend ne rejette jamais la promesse en cas d'échec : il faut
    // vérifier `error` explicitement, sinon un envoi refusé (clé invalide,
    // domaine d'expédition non vérifié, etc.) passe pour un succès silencieux.
    const { error } = await this.resend.emails.send({ from: this.from, to, subject, html });
    if (error) {
      this.logger.error(`Échec d'envoi d'email à ${to} (${subject}) : ${error.name} — ${error.message}`);
      throw new BadRequestException(`Échec de l'envoi de l'email : ${error.message}`);
    }
  }
}
