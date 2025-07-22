import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { getWelcomeEmailTemplate } from './templates/welcome.template';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendWelcome(email: string, username: string): Promise<void> {
    this.logger.log(`Envoi du mail de bienvenue à ${email}`);

    try {
      const mailOptions = {
        to: email,
        subject:
          "🎉 Bienvenue sur Zukii - Votre plateforme d'analyse collaborative",
        html: getWelcomeEmailTemplate(username),
        text: `Bienvenue sur Zukii, ${username} ! Nous sommes ravis de vous compter parmi nous. Zukii est votre nouvelle plateforme collaborative pour l'analyse de données CSV. Connectez-vous dès maintenant pour commencer à analyser vos données ! L'équipe Zukii`,
      };

      await this.mailerService.sendMail(mailOptions);

      this.logger.log(`Mail de bienvenue envoyé avec succès à ${email}`);
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi du mail à ${email}:`, error);
      throw error;
    }
  }
}
