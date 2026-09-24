import { Controller, Get, Param } from '@nestjs/common';
import { LegalService } from './legal.service';

@Controller('v1/legal')
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get()
  list() {
    return this.legalService.listPublic();
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.legalService.getPublicBySlug(slug);
  }
}
