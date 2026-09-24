import type { Product } from "./products.entities";

const shawarmaIngredients = [
  { id: "cucumber", name: "Огурец" },
  { id: "tomato", name: "Помидор" },
  { id: "cabbage", name: "Капуста" },
  { id: "onion", name: "Лук" },
  { id: "sauce", name: "Соус" },
  { id: "fries-in", name: "Картофель фри внутри" },
];

const shawarmaExtras = [
  { id: "cheese-extra", name: "Сыр", price: 50 },
  { id: "jalapeno", name: "Халапеньо", price: 30 },
  { id: "double-meat", name: "Двойное мясо", price: 120 },
  { id: "extra-sauce", name: "Доп. соус", price: 40 },
];

export const mockProducts: Product[] = [
  {
    id: "classic",
    name: "Классическая",
    description: "Курица на гриле, свежие овощи, фирменный соус в лаваше",
    price: 320,
    weight: "350 г",
    category: "shawarma",
    image:
      "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=80",
    popular: true,
    ingredients: shawarmaIngredients,
    extras: shawarmaExtras,
  },
  {
    id: "spicy",
    name: "Острая",
    description: "Курица, халапеньо, острый соус, хрустящий лук",
    price: 350,
    weight: "360 г",
    category: "shawarma",
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
    popular: true,
    ingredients: shawarmaIngredients,
    extras: shawarmaExtras,
  },
  {
    id: "cheese",
    name: "С сыром",
    description: "Курица, расплавленный сыр, овощи, чесночный соус",
    price: 380,
    weight: "380 г",
    category: "shawarma",
    image:
      "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=800&q=80",
    ingredients: shawarmaIngredients,
    extras: shawarmaExtras.filter((e) => e.id !== "cheese-extra"),
  },
  {
    id: "beef",
    name: "Говяжья",
    description: "Сочная говядина, маринованные овощи, тахини",
    price: 420,
    weight: "370 г",
    category: "shawarma",
    image:
      "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=800&q=80",
    popular: true,
    ingredients: shawarmaIngredients,
    extras: shawarmaExtras,
  },
  {
    id: "fries",
    name: "Картофель фри",
    description: "Хрустящий картофель с паприкой",
    price: 150,
    weight: "200 г",
    category: "sides",
    image:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80",
    extras: [
      { id: "cheese-sauce", name: "Сырный соус", price: 40 },
      { id: "ketchup", name: "Кетчуп", price: 20 },
    ],
  },
  {
    id: "nuggets",
    name: "Наггетсы",
    description: "6 шт. с соусом на выбор",
    price: 220,
    weight: "180 г",
    category: "sides",
    image:
      "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80",
    extras: [
      { id: "garlic-dip", name: "Чесночный дип", price: 40 },
      { id: "bbq-dip", name: "BBQ дип", price: 40 },
    ],
  },
  {
    id: "cola",
    name: "Кола",
    description: "0.5 л, охлаждённая",
    price: 120,
    weight: "0.5 л",
    category: "drinks",
    image:
      "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "ayran",
    name: "Айран",
    description: "Освежающий йогуртовый напиток",
    price: 100,
    weight: "0.33 л",
    category: "drinks",
    image:
      "https://images.unsplash.com/photo-1623065422902-30a2d94efe38?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "garlic",
    name: "Чесночный",
    description: "Фирменный густой соус",
    price: 50,
    weight: "50 мл",
    category: "sauces",
    image:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "bbq",
    name: "BBQ",
    description: "Копчёный сладко-острый",
    price: 50,
    weight: "50 мл",
    category: "sauces",
    image:
      "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80",
  },
];
