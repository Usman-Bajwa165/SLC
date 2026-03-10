import { Controller, Get, Post, Body } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappSettingsDto } from './dto/whatsapp.dto';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

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
}
