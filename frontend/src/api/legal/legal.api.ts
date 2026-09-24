import { apiClient } from "@/api/config";
import { mockDelay, USE_API_MOCK } from "@/api/mock";
import type {
  OwnerLegalDocumentDetail,
  OwnerLegalDocumentListItem,
  PublicLegalDocument,
  PublicLegalDocumentListItem,
} from "./legal.entities";

/**
 * GET /v1/legal
 */
export async function listPublicLegalDocuments(): Promise<{
  items: PublicLegalDocumentListItem[];
}> {
  if (USE_API_MOCK) {
    await mockDelay(100);
    return { items: [] };
  }
  return apiClient.get("v1/legal").json();
}

/**
 * GET /v1/legal/:slug
 */
export async function getPublicLegalDocument(
  slug: string,
): Promise<PublicLegalDocument> {
  if (USE_API_MOCK) {
    await mockDelay(150);
    throw new Error("Документ не опубликован");
  }
  return apiClient.get(`v1/legal/${encodeURIComponent(slug)}`).json();
}

/**
 * GET /v1/manager/legal
 */
export async function listOwnerLegalDocuments(): Promise<{
  items: OwnerLegalDocumentListItem[];
}> {
  if (USE_API_MOCK) {
    await mockDelay(150);
    return { items: [] };
  }
  return apiClient.get("v1/manager/legal").json();
}

/**
 * GET /v1/manager/legal/:slug
 */
export async function getOwnerLegalDocument(
  slug: string,
): Promise<OwnerLegalDocumentDetail> {
  if (USE_API_MOCK) {
    await mockDelay(150);
    throw new Error("Недоступно в mock");
  }
  return apiClient.get(`v1/manager/legal/${encodeURIComponent(slug)}`).json();
}

/**
 * PUT /v1/manager/legal/:slug/draft
 */
export async function saveLegalDraft(
  slug: string,
  body: { content: string; title?: string },
): Promise<{ id: string; slug: string; title: string; draftUpdatedAt: string | null }> {
  return apiClient
    .put(`v1/manager/legal/${encodeURIComponent(slug)}/draft`, { json: body })
    .json();
}

/**
 * POST /v1/manager/legal/:slug/publish
 */
export async function publishLegalDocument(
  slug: string,
): Promise<{ slug: string; title: string; version: string; publishedAt: string }> {
  return apiClient
    .post(`v1/manager/legal/${encodeURIComponent(slug)}/publish`)
    .json();
}

/**
 * POST /v1/manager/legal/:slug/import
 */
export async function importLegalDocument(
  slug: string,
  file: File,
): Promise<{
  slug: string;
  title: string;
  draftContent: string;
  draftUpdatedAt: string | null;
  imported: boolean;
  autoPublished: boolean;
}> {
  const form = new FormData();
  form.append("file", file);
  return apiClient
    .post(`v1/manager/legal/${encodeURIComponent(slug)}/import`, {
      body: form,
    })
    .json();
}
