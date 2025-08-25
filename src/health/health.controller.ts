import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }
}
