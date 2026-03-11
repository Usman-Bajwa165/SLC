import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappSettingsDto } from './dto/whatsapp.dto';
import { PrismaService } from '../../common/prisma/prisma.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('status')
  getStatus() {
    return this.whatsappService.getStatus();
  }

  @Post('logout')
  async logout() {
    return this.whatsappService.logout();
  }

  @Get('settings')
  async getSettings() {
    return this.whatsappService.getSettings();
  }

  @Post('settings')
  async updateSettings(@Body() dto: WhatsappSettingsDto) {
    return this.whatsappService.updateSettings(dto);
  }

  @Get('notifications')
  async getNotifications() {
    const notifications = await this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unreadCount = await this.prisma.notification.count({
      where: { isRead: false },
    });
    return { notifications, unreadCount };
  }

  @Patch('notifications/:id/read')
  async markAsRead(@Param('id') id: string) {
    return this.prisma.notification.update({
      where: { id: parseInt(id) },
      data: { isRead: true },
    });
  }

  @Post('notifications/mark-all-read')
  async markAllAsRead() {
    return this.prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
  }
}
