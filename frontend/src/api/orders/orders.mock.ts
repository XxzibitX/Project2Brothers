import type { Order } from "./orders.entities";

const minutesAgo = (m: number) =>
  new Date(Date.now() - m * 60_000).toISOString();

export const mockOrders: Order[] = [
  {
    id: "ORD-1042",
    customerName: "Алексей",
    customerPhone: "+7 900 111-22-33",
    deliveryAddress: {
      street: "Красная",
      house: "10",
      entrance: "2",
      apartment: "45",
      isPrivateHouse: false,
      formatted: "ул. Красная, д. 10, под. 2, кв. 45",
    },
    items: [
      {
        productId: "classic",
        name: "Классическая",
        price: 370,
        qty: 2,
        removedIngredientIds: ["onion"],
        extraIds: ["cheese-extra"],
        removedIngredients: [{ id: "onion", name: "Лук" }],
        selectedExtras: [{ id: "cheese-extra", name: "Сыр", price: 50 }],
      },
      { productId: "cola", name: "Кола", price: 120, qty: 1 },
    ],
    paymentMethod: "cash_courier",

    total: 860,
    status: "new",
    createdAt: minutesAgo(3),
  },
  {
    id: "ORD-1041",
    customerName: "Мария",
    deliveryAddress: {
      street: "Ставропольская",
      house: "85",
      isPrivateHouse: true,
      formatted: "ул. Ставропольская, д. 85, частный дом",
    },
    items: [
      {
        productId: "spicy",
        name: "Острая",
        price: 470,
        qty: 1,
        removedIngredientIds: ["cucumber", "sauce"],
        extraIds: ["double-meat"],
        removedIngredients: [
          { id: "cucumber", name: "Огурец" },
          { id: "sauce", name: "Соус" },
        ],
        selectedExtras: [{ id: "double-meat", name: "Двойное мясо", price: 120 }],
      },
      { productId: "fries", name: "Картофель фри", price: 150, qty: 1 },
      { productId: "ayran", name: "Айран", price: 100, qty: 1 },
    ],
    paymentMethod: "cash_courier",

    total: 720,
    status: "cooking",
    createdAt: minutesAgo(18),
  },
  {
    id: "ORD-1040",
    customerName: "Игорь",
    deliveryAddress: {
      street: "Северная",
      house: "321",
      entrance: "1",
      apartment: "12",
      isPrivateHouse: false,
      formatted: "ул. Северная, д. 321, под. 1, кв. 12",
    },
    items: [
      {
        productId: "beef",
        name: "Говяжья",
        price: 450,
        qty: 1,
        removedIngredientIds: ["cabbage"],
        extraIds: ["jalapeno"],
        removedIngredients: [{ id: "cabbage", name: "Капуста" }],
        selectedExtras: [{ id: "jalapeno", name: "Халапеньо", price: 30 }],
      },
      { productId: "bbq", name: "BBQ", price: 50, qty: 1 },
    ],
    paymentMethod: "cash_courier",

    total: 500,
    status: "ready",
    createdAt: minutesAgo(45),
  },
  {
    id: "ORD-1039",
    customerName: "Ольга",
    deliveryAddress: {
      street: "Тургенева",
      house: "140",
      apartment: "8",
      isPrivateHouse: false,
      formatted: "ул. Тургенева, д. 140, кв. 8",
    },
    items: [
      { productId: "cheese", name: "С сыром", price: 380, qty: 1 },
      { productId: "cola", name: "Кола", price: 120, qty: 2 },
    ],
    paymentMethod: "cash_courier",

    total: 620,
    status: "courier",
    createdAt: minutesAgo(55),
  },
  {
    id: "ORD-1038",
    customerName: "Дмитрий",
    deliveryAddress: {
      street: "Рашпилевская",
      house: "55",
      entrance: "3",
      apartment: "101",
      isPrivateHouse: false,
      formatted: "ул. Рашпилевская, д. 55, под. 3, кв. 101",
    },
    items: [
      {
        productId: "classic",
        name: "Классическая",
        price: 440,
        qty: 1,
        removedIngredientIds: ["tomato"],
        extraIds: ["extra-sauce", "jalapeno"],
        removedIngredients: [{ id: "tomato", name: "Помидор" }],
        selectedExtras: [
          { id: "extra-sauce", name: "Доп. соус", price: 40 },
          { id: "jalapeno", name: "Халапеньо", price: 30 },
        ],
      },
    ],
    paymentMethod: "cash_courier",

    total: 440,
    status: "done",
    createdAt: minutesAgo(90),
  },
  {
    id: "ORD-1037",
    customerName: "Анна",
    items: [{ productId: "fries", name: "Картофель фри", price: 150, qty: 3 }],
    paymentMethod: "cash_courier",

    total: 450,
    status: "cancelled",
    createdAt: minutesAgo(120),
  },
];
