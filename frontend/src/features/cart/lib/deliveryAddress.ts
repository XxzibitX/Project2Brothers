import type { DeliveryAddress } from "@/api/address/address.entities";

export type DeliveryAddressInput = {
  street: string;
  house: string;
  entrance: string;
  apartment: string;
  isPrivateHouse: boolean;
};

const STREET_TYPE_RE =
  /^(ул\.?|улица|пр-кт|проспект|пер\.?|переулок|б-р|бульвар|ш\.|шоссе|пл\.?|площадь|наб\.?|набережная)(?:\s+|$)/i;

function formatStreet(street: string): string {
  const trimmed = street.trim();
  if (!trimmed) return trimmed;

  const match = trimmed.match(STREET_TYPE_RE);
  if (!match) return `ул. ${trimmed}`;

  const type = match[1];
  const name = trimmed.slice(match[0].length).trim();
  // Нормализуем «ул Косарева» → «ул. Косарева»
  if (/^ул\.?$/i.test(type)) {
    return name ? `ул. ${name}` : "ул.";
  }
  return name ? `${type} ${name}` : type;
}

export function formatDeliveryAddress(
  parts: Omit<DeliveryAddress, "formatted"> | DeliveryAddressInput,
): string {
  const street = formatStreet(parts.street);
  const house = parts.house.trim();
  if (!street && !house) return "";

  const chunks: string[] = [];
  if (street) chunks.push(street);
  if (house) chunks.push(`д. ${house}`);

  if (parts.isPrivateHouse) {
    chunks.push("частный дом");
  } else {
    const entrance = parts.entrance?.trim();
    const apartment = parts.apartment?.trim();
    if (entrance) chunks.push(`под. ${entrance}`);
    if (apartment) chunks.push(`кв. ${apartment}`);
  }

  return chunks.join(", ");
}

export function normalizeHouseInput(value: string): string {
  return value
    .trim()
    .replace(/^(д\.?|дом)\s*/i, "")
    .replace(/\s+/g, " ");
}

export function normalizeEntranceInput(value: string): string {
  return value.trim().replace(/^(под\.?|подъезд)\s*/i, "");
}

export function normalizeApartmentInput(value: string): string {
  return value.trim().replace(/^(кв\.?|квартира)\s*/i, "");
}

export type DeliveryAddressErrors = Partial<
  Record<"street" | "house" | "apartment", string>
>;

export function validateDeliveryAddress(
  value: DeliveryAddressInput,
): DeliveryAddressErrors {
  const errors: DeliveryAddressErrors = {};
  if (!value.street.trim() || value.street.trim().length < 2) {
    errors.street = "Укажите улицу";
  }
  if (!value.house.trim()) {
    errors.house = "Укажите номер дома";
  }
  if (!value.isPrivateHouse && !value.apartment.trim()) {
    errors.apartment = "Укажите квартиру или отметьте частный дом";
  }
  return errors;
}

export function toDeliveryAddressPayload(
  value: DeliveryAddressInput,
): Omit<DeliveryAddress, "formatted"> & { formatted: string } {
  const street = value.street.trim();
  const house = normalizeHouseInput(value.house);
  const entrance = normalizeEntranceInput(value.entrance) || undefined;
  const apartment = value.isPrivateHouse
    ? undefined
    : normalizeApartmentInput(value.apartment) || undefined;

  const payload = {
    street,
    house,
    ...(entrance ? { entrance } : {}),
    ...(apartment ? { apartment } : {}),
    isPrivateHouse: value.isPrivateHouse,
  };

  return {
    ...payload,
    formatted: formatDeliveryAddress({
      ...payload,
      entrance: entrance ?? "",
      apartment: apartment ?? "",
    }),
  };
}

export const emptyDeliveryAddress: DeliveryAddressInput = {
  street: "",
  house: "",
  entrance: "",
  apartment: "",
  isPrivateHouse: false,
};
