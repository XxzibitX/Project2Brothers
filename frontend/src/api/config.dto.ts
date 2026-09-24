export interface OrderSlaConfig {
  /** До этого времени (мин) — зелёный */
  greenMinutes: number;
  /** После green и до этого — жёлтый; дальше — красный */
  yellowMinutes: number;
}

export const DEFAULT_ORDER_SLA: OrderSlaConfig = {
  greenMinutes: 10,
  yellowMinutes: 40,
};

export interface ConfigResponse {
  appName?: string;
  currency?: string;
  orderSla?: OrderSlaConfig;
  /** Телефон поддержки / кафе (публичный) */
  supportPhone?: string;
  cafeAddress?: string;
  workingHours?: string;
  [key: string]: unknown;
}
