/** Публичный опубликованный документ */
export interface PublicLegalDocument {
  title: string;
  slug: string;
  version: string;
  content: string;
  publishedAt: string;
}

export interface PublicLegalDocumentListItem {
  title: string;
  slug: string;
  version: string;
  publishedAt: string | null;
}

export interface OwnerLegalDocumentListItem {
  id: string;
  type: "PRIVACY" | "OFFER" | "DELIVERY_INFO";
  slug: string;
  title: string;
  hasDraft: boolean;
  draftUpdatedAt: string | null;
  publishedVersion: string | null;
  publishedAt: string | null;
  status: "published" | "draft";
}

export interface OwnerLegalDocumentVersion {
  id: string;
  version: string;
  publishedAt: string;
  createdAt: string;
  createdBy: { id: string; name: string; phone: string } | null;
}

export interface OwnerLegalDocumentDetail {
  id: string;
  type: "PRIVACY" | "OFFER" | "DELIVERY_INFO";
  slug: string;
  title: string;
  draftContent: string;
  draftUpdatedAt: string | null;
  publishedVersion: string | null;
  publishedAt: string | null;
  status: "published" | "draft";
  versions: OwnerLegalDocumentVersion[];
}
