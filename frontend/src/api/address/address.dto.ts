import type { AddressSuggestion } from "./address.entities";

export interface AddressSuggestDto {
  query: string;
  count?: number;
}

export type AddressSuggestResponse = AddressSuggestion[];
