import { Controller, Get } from '@nestjs/common';
import { AppConfigService } from './app-config.service';

@Controller('v1/config')
export class ConfigController {
  constructor(private readonly configService: AppConfigService) {}

  @Get()
  getConfig() {
    return this.configService.getPublicConfig();
  }
}
