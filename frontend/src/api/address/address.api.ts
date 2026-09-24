import { apiClient } from "@/api/config";
import { mockDelay, USE_API_MOCK } from "@/api/mock";
import type { AddressSuggestDto, AddressSuggestResponse } from "./address.dto";
import type { AddressSuggestion } from "./address.entities";

const MOCK_STREETS: AddressSuggestion[] = [
  {
    value: "г Саранск, ул Советская",
    unrestrictedValue: "430000, Респ Мордовия, г Саранск, ул Советская",
    street: "Советская",
    house: null,
    block: null,
    city: "Саранск",
    settlement: null,
  },
  {
    value: "г Саранск, ул Советская, д 10",
    unrestrictedValue:
      "430000, Респ Мордовия, г Саранск, ул Советская, д 10",
    street: "Советская",
    house: "10",
    block: null,
    city: "Саранск",
    settlement: null,
  },
  {
    value: "г Саранск, ул Косарева, д 15",
    unrestrictedValue: "430000, Респ Мордовия, г Саранск, ул Косарева, д 15",
    street: "Косарева",
    house: "15",
    block: null,
    city: "Саранск",
    settlement: null,
  },
];

/**
 * POST /v1/address/suggest — подсказки DaData (через бэкенд)
 */
export async function suggestAddress(
  body: AddressSuggestDto,
): Promise<AddressSuggestResponse> {
  if (USE_API_MOCK) {
    await mockDelay(200);
    const q = body.query.trim().toLowerCase();
    if (q.length < 2) return [];
    return MOCK_STREETS.filter(
      (s) =>
        s.value.toLowerCase().includes(q) ||
        s.street.toLowerCase().includes(q),
    ).slice(0, body.count ?? 7);
  }

  return apiClient
    .post("v1/address/suggest", { json: body })
    .json<AddressSuggestResponse>();
}
