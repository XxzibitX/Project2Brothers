import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.guard';
import {
  CurrentUser,
  type AuthUserPayload,
} from '../common/current-user.decorator';
import { SaveLegalDraftDto } from '../common/dto';
import { LegalService } from './legal.service';

const legalImportMulterOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const name = (file.originalname || '').toLowerCase();
    const ok =
      name.endsWith('.pdf') ||
      name.endsWith('.doc') ||
      name.endsWith('.docx') ||
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    cb(
      ok
        ? null
        : new BadRequestException('Допустимы только PDF, DOC и DOCX'),
      ok,
    );
  },
};

@Controller('v1/manager/legal')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner')
export class ManagerLegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get()
  list() {
    return this.legalService.listForOwner();
  }

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.legalService.getForOwner(slug);
  }

  @Put(':slug/draft')
  saveDraft(@Param('slug') slug: string, @Body() dto: SaveLegalDraftDto) {
    return this.legalService.saveDraft(slug, dto.content, dto.title);
  }

  @Post(':slug/publish')
  publish(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.legalService.publish(slug, user.id);
  }

  @Post(':slug/import')
  @UseInterceptors(FileInterceptor('file', legalImportMulterOptions))
  importFile(
    @Param('slug') slug: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.legalService.importFile(slug, file);
  }
}
