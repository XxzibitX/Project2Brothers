import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConsentType, LegalDocumentType } from '@prisma/client';
import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import WordExtractor from 'word-extractor';
import { PrismaService } from '../prisma/prisma.service';

export const LEGAL_DOCUMENT_DEFS: {
  type: LegalDocumentType;
  slug: string;
  title: string;
}[] = [
  {
    type: 'PRIVACY',
    slug: 'privacy',
    title: 'Политика обработки персональных данных',
  },
  {
    type: 'OFFER',
    slug: 'offer',
    title: 'Публичная оферта',
  },
  {
    type: 'DELIVERY_INFO',
    slug: 'delivery-info',
    title: 'Информация о доставке и оплате',
  },
];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Plain text → простой HTML с абзацами */
function plainTextToHtml(text: string): string {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return '';
  return normalized
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block
        .split('\n')
        .map((l) => escapeHtml(l.trim()))
        .filter(Boolean)
        .join('<br />');
      return lines ? `<p>${lines}</p>` : '';
    })
    .filter(Boolean)
    .join('\n');
}

function bumpVersion(current: string | null | undefined): string {
  if (!current) return '1.0';
  const match = /^(\d+)\.(\d+)$/.exec(current.trim());
  if (!match) return '1.0';
  const major = Number(match[1]);
  const minor = Number(match[2]);
  return `${major}.${minor + 1}`;
}

@Injectable()
export class LegalService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureDocuments();
  }

  async ensureDocuments() {
    for (const def of LEGAL_DOCUMENT_DEFS) {
      await this.prisma.legalDocument.upsert({
        where: { type: def.type },
        create: {
          type: def.type,
          slug: def.slug,
          title: def.title,
          draftContent: '',
        },
        update: {
          title: def.title,
          slug: def.slug,
        },
      });
    }

    // Минимальная опубликованная политика, чтобы регистрация работала «из коробки»
    const privacy = await this.prisma.legalDocument.findUnique({
      where: { type: 'PRIVACY' },
    });
    if (privacy && !privacy.publishedVersion) {
      const initialHtml = [
        '<h2>1. Общие положения</h2>',
        '<p>Настоящая Политика определяет порядок обработки персональных данных пользователей сервиса 2Brothers.</p>',
        '<h2>2. Какие данные мы обрабатываем</h2>',
        '<p>Имя, номер телефона, данные заказов и технические сведения, необходимые для оказания услуг.</p>',
        '<h2>3. Цели обработки</h2>',
        '<p>Регистрация, оформление и исполнение заказов, связь с клиентом, улучшение сервиса.</p>',
        '<h2>4. Контакты</h2>',
        '<p>По вопросам обработки персональных данных обратитесь в кафе по контактам, указанным на сайте.</p>',
      ].join('\n');
      const now = new Date();
      await this.prisma.$transaction([
        this.prisma.legalDocumentVersion.create({
          data: {
            documentId: privacy.id,
            version: '1.0',
            content: initialHtml,
            publishedAt: now,
          },
        }),
        this.prisma.legalDocument.update({
          where: { id: privacy.id },
          data: {
            draftContent: initialHtml,
            draftUpdatedAt: now,
            publishedVersion: '1.0',
            publishedAt: now,
          },
        }),
      ]);
    }
  }

  async listPublic() {
    const docs = await this.prisma.legalDocument.findMany({
      where: { publishedVersion: { not: null } },
      orderBy: { title: 'asc' },
      select: {
        title: true,
        slug: true,
        publishedVersion: true,
        publishedAt: true,
      },
    });
    return {
      items: docs.map((d) => ({
        title: d.title,
        slug: d.slug,
        version: d.publishedVersion!,
        publishedAt: d.publishedAt?.toISOString() ?? null,
      })),
    };
  }

  async getPublicBySlug(slug: string) {
    const found = await this.prisma.legalDocument.findUnique({
      where: { slug },
    });
    if (!found?.publishedVersion) {
      throw new NotFoundException('Документ не опубликован');
    }

    const version = await this.prisma.legalDocumentVersion.findUnique({
      where: {
        documentId_version: {
          documentId: found.id,
          version: found.publishedVersion,
        },
      },
    });
    if (!version) {
      throw new NotFoundException('Документ не опубликован');
    }

    return {
      title: found.title,
      slug: found.slug,
      version: version.version,
      content: version.content,
      publishedAt: version.publishedAt.toISOString(),
    };
  }

  async listForOwner() {
    await this.ensureDocuments();
    const docs = await this.prisma.legalDocument.findMany({
      orderBy: { type: 'asc' },
      include: {
        versions: {
          orderBy: { publishedAt: 'desc' },
          take: 1,
          select: { publishedAt: true, version: true },
        },
      },
    });

    return {
      items: docs.map((d) => ({
        id: d.id,
        type: d.type,
        slug: d.slug,
        title: d.title,
        hasDraft: Boolean(d.draftContent?.trim()),
        draftUpdatedAt: d.draftUpdatedAt?.toISOString() ?? null,
        publishedVersion: d.publishedVersion,
        publishedAt: d.publishedAt?.toISOString() ?? null,
        status: d.publishedVersion ? ('published' as const) : ('draft' as const),
      })),
    };
  }

  async getForOwner(slug: string) {
    await this.ensureDocuments();
    const doc = await this.prisma.legalDocument.findUnique({
      where: { slug },
      include: {
        versions: {
          orderBy: { publishedAt: 'desc' },
          select: {
            id: true,
            version: true,
            publishedAt: true,
            createdAt: true,
            createdById: true,
            createdBy: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });
    if (!doc) throw new NotFoundException('Документ не найден');

    return {
      id: doc.id,
      type: doc.type,
      slug: doc.slug,
      title: doc.title,
      draftContent: doc.draftContent,
      draftUpdatedAt: doc.draftUpdatedAt?.toISOString() ?? null,
      publishedVersion: doc.publishedVersion,
      publishedAt: doc.publishedAt?.toISOString() ?? null,
      status: doc.publishedVersion ? ('published' as const) : ('draft' as const),
      versions: doc.versions.map((v) => ({
        id: v.id,
        version: v.version,
        publishedAt: v.publishedAt.toISOString(),
        createdAt: v.createdAt.toISOString(),
        createdBy: v.createdBy
          ? { id: v.createdBy.id, name: v.createdBy.name, phone: v.createdBy.phone }
          : null,
      })),
    };
  }

  async saveDraft(slug: string, content: string, title?: string) {
    const doc = await this.prisma.legalDocument.findUnique({ where: { slug } });
    if (!doc) throw new NotFoundException('Документ не найден');

    const updated = await this.prisma.legalDocument.update({
      where: { id: doc.id },
      data: {
        draftContent: content,
        draftUpdatedAt: new Date(),
        ...(title?.trim() ? { title: title.trim() } : {}),
      },
    });

    return {
      id: updated.id,
      slug: updated.slug,
      title: updated.title,
      draftUpdatedAt: updated.draftUpdatedAt?.toISOString() ?? null,
    };
  }

  async publish(slug: string, userId: string) {
    const doc = await this.prisma.legalDocument.findUnique({ where: { slug } });
    if (!doc) throw new NotFoundException('Документ не найден');

    const content = doc.draftContent?.trim() ?? '';
    if (!content) {
      throw new BadRequestException('Нельзя опубликовать пустой документ');
    }

    const nextVersion = bumpVersion(doc.publishedVersion);
    const now = new Date();

    const [version] = await this.prisma.$transaction([
      this.prisma.legalDocumentVersion.create({
        data: {
          documentId: doc.id,
          version: nextVersion,
          content: doc.draftContent,
          createdById: userId,
          publishedAt: now,
        },
      }),
      this.prisma.legalDocument.update({
        where: { id: doc.id },
        data: {
          publishedVersion: nextVersion,
          publishedAt: now,
        },
      }),
    ]);

    return {
      slug: doc.slug,
      title: doc.title,
      version: version.version,
      publishedAt: version.publishedAt.toISOString(),
    };
  }

  async importFile(slug: string, file: Express.Multer.File) {
    const doc = await this.prisma.legalDocument.findUnique({ where: { slug } });
    if (!doc) throw new NotFoundException('Документ не найден');
    if (!file?.buffer?.length) {
      throw new BadRequestException('Файл не получен');
    }

    const name = (file.originalname || '').toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();
    let html = '';

    try {
      if (
        name.endsWith('.docx') ||
        mime.includes(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        )
      ) {
        const result = await mammoth.convertToHtml({ buffer: file.buffer });
        html = result.value?.trim() ?? '';
      } else if (name.endsWith('.doc') || mime === 'application/msword') {
        const extractor = new WordExtractor();
        const extracted = await extractor.extract(file.buffer);
        html = plainTextToHtml(extracted.getBody() || '');
      } else if (name.endsWith('.pdf') || mime === 'application/pdf') {
        const parser = new PDFParse({ data: file.buffer });
        try {
          const result = await parser.getText();
          const text = (result?.text || '').trim();
          if (!text || text.replace(/\s/g, '').length < 20) {
            throw new BadRequestException(
              'Не удалось извлечь текст из PDF. Возможно, это сканированный документ без текстового слоя. Загрузите DOCX или отредактируйте текст вручную.',
            );
          }
          html = plainTextToHtml(text);
        } finally {
          await parser.destroy().catch(() => undefined);
        }
      } else {
        throw new BadRequestException(
          'Поддерживаются только файлы PDF, DOC и DOCX',
        );
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      const message =
        err instanceof Error ? err.message : 'Ошибка чтения файла';
      throw new BadRequestException(
        `Не удалось прочитать документ: ${message}`,
      );
    }

    if (!html.trim()) {
      throw new BadRequestException(
        'Файл не содержит извлекаемого текста. Проверьте документ или введите текст вручную.',
      );
    }

    const updated = await this.prisma.legalDocument.update({
      where: { id: doc.id },
      data: {
        draftContent: html,
        draftUpdatedAt: new Date(),
      },
    });

    return {
      slug: updated.slug,
      title: updated.title,
      draftContent: updated.draftContent,
      draftUpdatedAt: updated.draftUpdatedAt?.toISOString() ?? null,
      imported: true,
      autoPublished: false,
    };
  }

  async getPublishedPrivacyVersion() {
    const doc = await this.prisma.legalDocument.findUnique({
      where: { type: 'PRIVACY' },
    });
    if (!doc?.publishedVersion) return null;
    const version = await this.prisma.legalDocumentVersion.findUnique({
      where: {
        documentId_version: {
          documentId: doc.id,
          version: doc.publishedVersion,
        },
      },
    });
    if (!version) return null;
    return { document: doc, version };
  }

  async recordPersonalDataConsent(opts: {
    userId: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    const published = await this.getPublishedPrivacyVersion();
    if (!published) {
      throw new BadRequestException(
        'Регистрация временно недоступна: политика обработки персональных данных ещё не опубликована',
      );
    }

    await this.prisma.consent.create({
      data: {
        userId: opts.userId,
        type: 'PERSONAL_DATA' satisfies ConsentType,
        documentId: published.document.id,
        documentVersionId: published.version.id,
        documentVersion: published.version.version,
        ipAddress: opts.ipAddress ?? null,
        userAgent: opts.userAgent ?? null,
      },
    });
  }
}
