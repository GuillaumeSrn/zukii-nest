import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendWelcome(email: string, username: string): Promise<void> {
    this.logger.log(`Envoi du mail de bienvenue à ${email}`);
    await this.mailerService.sendMail({
      to: email,
      subject: 'Bienvenue sur Zukii',
      text: `Bonjour ${username},\n\nBienvenue sur Zukii ! Nous sommes ravis de vous compter parmi nous.`,
    });
  }
}
