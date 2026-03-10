import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappService.name);
  private client: Client;
  private qrCodeData: string | null = null;
  private isConnected = false;
  private isConnecting = false;
  private connectedNumber: string | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.initClient();
  }

  private async initClient() {
    this.logger.log('Initializing WhatsApp Client...');
    
    if (this.client) {
      try {
        await this.client.destroy();
      } catch (e) {
        this.logger.warn('Error destroying active client:', e);
      }
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.qrCodeData = null;

    // Configure Puppeteer with arguments for stability
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'slc-core-whatsapp'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
      }
    });

    this.client.on('qr', async (qr) => {
      this.logger.log('QR Code Received. Scan to connect.');
      try {
        this.qrCodeData = await qrcode.toDataURL(qr, { margin: 2, scale: 8 });
        this.isConnected = false;
        this.isConnecting = false;
      } catch (err) {
        this.logger.error('Failed to generate QR Code:', err);
      }
    });

    this.client.on('loading_screen', (percent, message) => {
      this.logger.log(`WhatsApp LOADING: ${percent}% - ${message}`);
      this.isConnecting = true;
      this.qrCodeData = null;
    });

    this.client.on('ready', async () => {
      this.logger.log('WhatsApp Client is READY and CONNECTED.');
      this.isConnected = true;
      this.isConnecting = false;
      this.qrCodeData = null;
      
      try {
        const info = await this.client.info;
        this.connectedNumber = info?.wid?.user || null;
        this.logger.log(`Connected WhatsApp Number: ${this.connectedNumber}`);
      } catch (e) {
        this.logger.warn('Could not retrieve connected number:', e);
      }
    });

    this.client.on('authenticated', () => {
      this.logger.log('WhatsApp Client Authenticated successfully.');
      this.isConnecting = true;
      this.qrCodeData = null;
    });

    this.client.on('auth_failure', (msg) => {
      this.logger.error('WhatsApp Authentication Failure:', msg);
      this.isConnected = false;
      this.isConnecting = false;
      this.qrCodeData = null;
    });

    this.client.on('disconnected', (reason) => {
      this.logger.warn('WhatsApp Client Disconnected:', reason);
      this.isConnected = false;
      this.isConnecting = false;
      this.qrCodeData = null;
      this.logger.log('Re-initializing client...');
      this.initClient();
    });

    try {
      await this.client.initialize();
    } catch (err) {
      this.logger.error('Failed to initialize WhatsApp Client:', err);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      this.logger.log('Destroying WhatsApp Client...');
      await this.client.destroy();
    }
  }

  // --- Public Methods --- //

  getStatus() {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      qrCode: this.qrCodeData,
      connectedNumber: this.connectedNumber,
    };
  }

  async logout() {
    this.logger.log('Manual Logout requested.');
    if (this.client) {
      try {
        await this.client.logout();
      } catch (e) {
        this.logger.warn('Error during logout:', e);
      }
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.qrCodeData = null;
    this.connectedNumber = null;
    
    // Completely rebuild the client so a new QR code triggers
    this.initClient();
    
    return { success: true };
  }

  async getSettings() {
    let settings = await this.prisma.whatsappSettings.findFirst();
    if (!settings) {
      settings = await this.prisma.whatsappSettings.create({ data: {} });
    }
    return settings;
  }

  async updateSettings(data: any) {
    let settings = await this.prisma.whatsappSettings.findFirst();
    if (!settings) {
      return this.prisma.whatsappSettings.create({ data });
    }
    return this.prisma.whatsappSettings.update({
      where: { id: settings.id },
      data,
    });
  }

  /**
   * Helper to format a Pakistani number to WhatsApp format.
   * Expects format like "92 300 1234567" or "923001234567"
   */
  private formatPhoneNumber(number: string): string {
    const digitsOnly = number.replace(/\D/g, '');
    return `${digitsOnly}@c.us`;
  }

  /**
   * Send a text message to a specific number.
   */
  async sendMessage(to: string, message: string): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.warn('Cannot send message. WhatsApp is disconnected.');
      return false;
    }

    try {
      const formattedNumber = this.formatPhoneNumber(to);
      await this.client.sendMessage(formattedNumber, message);
      this.logger.log(`Message sent successfully to ${formattedNumber}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send message to ${to}:`, error);
      return false;
    }
  }

  /**
   * Send a file to a specific number.
   */
  async sendFile(to: string, filePath: string, caption?: string): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.warn('Cannot send file. WhatsApp is disconnected.');
      return false;
    }

    try {
      const formattedNumber = this.formatPhoneNumber(to);
      const media = MessageMedia.fromFilePath(filePath);
      await this.client.sendMessage(formattedNumber, media, { caption });
      this.logger.log(`File sent successfully to ${formattedNumber}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send file to ${to}:`, error);
      return false;
    }
  }

  /**
   * Send a system notification based on settings.
   */
  async sendSystemNotification(type: 'student' | 'staff' | 'finance' | 'account' | 'enrollment' | 'deactivation', message: string) {
    const settings = await this.getSettings();
    let shouldSend = false;

    switch (type) {
      case 'student': shouldSend = settings.notifyStudentPayments; break;
      case 'staff': shouldSend = settings.notifyStaffPayments; break;
      case 'finance': shouldSend = settings.notifyFinance; break;
      case 'account': shouldSend = settings.notifyAccounts; break;
      case 'enrollment': shouldSend = settings.notifyEnrollment; break;
      case 'deactivation': shouldSend = settings.notifyDeactivation; break;
    }

    if (shouldSend && settings.toNumber && settings.toNumber.length > 5) {
      await this.sendMessage(settings.toNumber, message);
    }
  }
}
