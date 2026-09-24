import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getOwnerLegalDocument,
  getPublicLegalDocument,
  importLegalDocument,
  listOwnerLegalDocuments,
  listPublicLegalDocuments,
  publishLegalDocument,
  saveLegalDraft,
} from "@/api";

export const PUBLIC_LEGAL_LIST_KEY = ["legal", "public"] as const;
export const OWNER_LEGAL_LIST_KEY = ["legal", "owner"] as const;

export function usePublicLegalList() {
  return useQuery({
    queryKey: PUBLIC_LEGAL_LIST_KEY,
    queryFn: listPublicLegalDocuments,
    staleTime: 5 * 60_000,
  });
}

export function usePublicLegalDocument(slug: string) {
  return useQuery({
    queryKey: ["legal", "public", slug],
    queryFn: () => getPublicLegalDocument(slug),
    enabled: Boolean(slug),
  });
}

export function useOwnerLegalList(enabled: boolean) {
  return useQuery({
    queryKey: OWNER_LEGAL_LIST_KEY,
    queryFn: listOwnerLegalDocuments,
    enabled,
  });
}

export function useOwnerLegalDocument(slug: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["legal", "owner", slug],
    queryFn: () => getOwnerLegalDocument(slug!),
    enabled: enabled && Boolean(slug),
  });
}

export function useSaveLegalDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { slug: string; content: string; title?: string }) =>
      saveLegalDraft(args.slug, { content: args.content, title: args.title }),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: OWNER_LEGAL_LIST_KEY });
      void qc.invalidateQueries({ queryKey: ["legal", "owner", vars.slug] });
    },
  });
}

export function usePublishLegalDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => publishLegalDocument(slug),
    onSuccess: (_data, slug) => {
      void qc.invalidateQueries({ queryKey: OWNER_LEGAL_LIST_KEY });
      void qc.invalidateQueries({ queryKey: ["legal", "owner", slug] });
      void qc.invalidateQueries({ queryKey: PUBLIC_LEGAL_LIST_KEY });
      void qc.invalidateQueries({ queryKey: ["legal", "public", slug] });
    },
  });
}

export function useImportLegalDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { slug: string; file: File }) =>
      importLegalDocument(args.slug, args.file),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: OWNER_LEGAL_LIST_KEY });
      void qc.invalidateQueries({ queryKey: ["legal", "owner", vars.slug] });
    },
  });
}
