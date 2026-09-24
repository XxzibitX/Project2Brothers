export type DeliveryAddressParts = {
  street: string;
  house: string;
  entrance?: string | null;
  apartment?: string | null;
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
    return name ? `ул. ${name}` : 'ул.';
  }
  return name ? `${type} ${name}` : type;
}

/** Единый формат адреса для UI / Telegram / БД */
export function formatDeliveryAddress(parts: DeliveryAddressParts): string {
  const street = formatStreet(parts.street);
  const house = parts.house.trim();
  const chunks = [street, `д. ${house}`].filter(Boolean);

  if (parts.isPrivateHouse) {
    chunks.push('частный дом');
  } else {
    const entrance = parts.entrance?.trim();
    const apartment = parts.apartment?.trim();
    if (entrance) chunks.push(`под. ${entrance}`);
    if (apartment) chunks.push(`кв. ${apartment}`);
  }

  return chunks.join(', ');
}
