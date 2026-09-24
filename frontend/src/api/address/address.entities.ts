export interface DeliveryAddress {
  street: string;
  house: string;
  entrance?: string;
  apartment?: string;
  isPrivateHouse: boolean;
  /** Готовая строка для отображения */
  formatted: string;
}

export interface AddressSuggestion {
  value: string;
  unrestrictedValue: string;
  street: string;
  house: string | null;
  block: string | null;
  city: string | null;
  settlement: string | null;
}
