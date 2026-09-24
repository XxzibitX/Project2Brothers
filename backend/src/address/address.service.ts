import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type AddressSuggestion = {
  value: string;
  unrestrictedValue: string;
  street: string;
  house: string | null;
  block: string | null;
  city: string | null;
  settlement: string | null;
};

type DaDataSuggestion = {
  value?: string;
  unrestricted_value?: string;
  data?: {
    city?: string | null;
    settlement?: string | null;
    street_with_type?: string | null;
    street?: string | null;
    house?: string | null;
    block?: string | null;
    house_type?: string | null;
  };
};

type DaDataSuggestResponse = {
  suggestions?: DaDataSuggestion[];
};

@Injectable()
export class AddressService {
  constructor(private readonly config: ConfigService) {}

  async suggest(query: string, count = 7): Promise<AddressSuggestion[]> {
    const token = this.config.get<string>('DADATA_API_KEY')?.trim();
    if (!token) {
      throw new ServiceUnavailableException(
        'Подсказки адреса недоступны: не задан DADATA_API_KEY',
      );
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const limit = Math.min(20, Math.max(1, count));

    let response: Response;
    try {
      response = await fetch(
        'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({
            query: trimmed,
            count: limit,
            from_bound: { value: 'street' },
            to_bound: { value: 'house' },
            locations: [{ city: 'Саранск' }],
          }),
        },
      );
    } catch {
      throw new BadGatewayException('Не удалось связаться с DaData');
    }

    if (!response.ok) {
      throw new BadGatewayException(
        `DaData вернула ошибку (${response.status})`,
      );
    }

    const data = (await response.json()) as DaDataSuggestResponse;
    return (data.suggestions ?? [])
      .map((item) => this.mapSuggestion(item))
      .filter((item): item is AddressSuggestion => item != null);
  }

  private mapSuggestion(item: DaDataSuggestion): AddressSuggestion | null {
    const data = item.data;
    if (!data) return null;

    const street =
      data.street_with_type?.trim() ||
      (data.street ? `ул ${data.street}` : '') ||
      '';
    if (!street) return null;

    let house = data.house?.trim() || null;
    if (house && data.block) {
      house = `${house} к${data.block}`;
    }

    return {
      value: item.value ?? street,
      unrestrictedValue: item.unrestricted_value ?? item.value ?? street,
      street,
      house,
      block: data.block ?? null,
      city: data.city ?? null,
      settlement: data.settlement ?? null,
    };
  }
}
