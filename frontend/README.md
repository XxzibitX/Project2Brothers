# 2Brothers Frontend

Стек и структура как в agregator: `api/` + `features/` + тонкие `pages/`.

## Структура

```
src/
  api/
    products/   products.api.ts | .dto.ts | .entities.ts | .mock.ts
    orders/     orders.api.ts   | .dto.ts | .entities.ts | .mock.ts
  features/
    catalog/    components, api/useProducts
    cart/       context
    account/    components, api
    manager/    components, api, constants
  components/navigation/  Layout, Header, Footer
  pages/home|account|manager
```

## Моки → реальный бэкенд

Сейчас `VITE_USE_API_MOCK=true` — функции в `*.api.ts` отдают моки.

Когда бэкенд готов:
1. Поставь `VITE_USE_API_MOCK=false`
2. Эндпоинты уже описаны в `products.api.ts` / `orders.api.ts`

### Контракт

| Method | Path | Body / Query |
|--------|------|----------------|
| GET | `/api/v1/products` | `?category=` |
| GET | `/api/v1/products/:id` | |
| GET | `/api/v1/orders` | `?scope=manager\|customer&status=` |
| GET | `/api/v1/orders/:id` | |
| POST | `/api/v1/orders` | `CreateOrderDto` |
| PATCH | `/api/v1/orders/:id/status` | `{ status }` |

## Запуск

```bash
cd frontend
npm install
npm run dev
```
