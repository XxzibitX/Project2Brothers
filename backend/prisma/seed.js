"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
/** Source of truth. After edits run: npm run prisma:seed:compile */
const prisma = new client_1.PrismaClient();
const shawarmaIngredients = [
    { key: 'cucumber', name: 'Огурец' },
    { key: 'tomato', name: 'Помидор' },
    { key: 'cabbage', name: 'Капуста' },
    { key: 'onion', name: 'Лук' },
    { key: 'sauce', name: 'Соус' },
    { key: 'fries-in', name: 'Картофель фри внутри' },
];
const shawarmaExtras = [
    { key: 'cheese-extra', name: 'Сыр', price: 50 },
    { key: 'jalapeno', name: 'Халапеньо', price: 30 },
    { key: 'double-meat', name: 'Двойное мясо', price: 120 },
    { key: 'extra-sauce', name: 'Доп. соус', price: 40 },
];
const products = [
    {
        id: 'classic',
        name: 'Классическая',
        description: 'Курица на гриле, свежие овощи, фирменный соус в лаваше',
        price: 320,
        weight: '350 г',
        category: 'shawarma',
        image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=80',
        popular: true,
        ingredients: shawarmaIngredients,
        extras: shawarmaExtras,
    },
    {
        id: 'spicy',
        name: 'Острая',
        description: 'Курица, халапеньо, острый соус, хрустящий лук',
        price: 350,
        weight: '360 г',
        category: 'shawarma',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
        popular: true,
        ingredients: shawarmaIngredients,
        extras: shawarmaExtras,
    },
    {
        id: 'cheese',
        name: 'С сыром',
        description: 'Курица, расплавленный сыр, овощи, чесночный соус',
        price: 380,
        weight: '380 г',
        category: 'shawarma',
        image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=800&q=80',
        ingredients: shawarmaIngredients,
        extras: shawarmaExtras.filter((e) => e.key !== 'cheese-extra'),
    },
    {
        id: 'beef',
        name: 'Говяжья',
        description: 'Сочная говядина, маринованные овощи, тахини',
        price: 420,
        weight: '370 г',
        category: 'shawarma',
        image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=800&q=80',
        popular: true,
        ingredients: shawarmaIngredients,
        extras: shawarmaExtras,
    },
    {
        id: 'fries',
        name: 'Картофель фри',
        description: 'Хрустящий картофель с паприкой',
        price: 150,
        weight: '200 г',
        category: 'sides',
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
        extras: [
            { key: 'cheese-sauce', name: 'Сырный соус', price: 40 },
            { key: 'ketchup', name: 'Кетчуп', price: 20 },
        ],
    },
    {
        id: 'nuggets',
        name: 'Наггетсы',
        description: '6 шт. с соусом на выбор',
        price: 220,
        weight: '180 г',
        category: 'sides',
        image: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
        extras: [
            { key: 'garlic-dip', name: 'Чесночный дип', price: 40 },
            { key: 'bbq-dip', name: 'BBQ дип', price: 40 },
        ],
    },
    {
        id: 'cola',
        name: 'Кола',
        description: '0.5 л, охлаждённая',
        price: 120,
        weight: '0.5 л',
        category: 'drinks',
        image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'ayran',
        name: 'Айран',
        description: 'Освежающий йогуртовый напиток',
        price: 100,
        weight: '0.33 л',
        category: 'drinks',
        image: 'https://images.unsplash.com/photo-1623065422902-30a2d94efe38?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'garlic',
        name: 'Чесночный',
        description: 'Фирменный густой соус',
        price: 50,
        weight: '50 мл',
        category: 'sauces',
        image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'bbq',
        name: 'BBQ',
        description: 'Копчёный сладко-острый',
        price: 50,
        weight: '50 мл',
        category: 'sauces',
        image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80',
    },
];
async function main() {
    var _a, _b, _c;
    await prisma.consent.deleteMany().catch(() => undefined);
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.productExtra.deleteMany();
    await prisma.productIngredient.deleteMany();
    await prisma.product.deleteMany();
    await prisma.menuExtra.deleteMany();
    await prisma.menuCategory.deleteMany();
    await prisma.user.deleteMany();
    await prisma.appConfig.deleteMany();
    const demoHash = await bcrypt.hash('123456', 10);
    await prisma.menuCategory.createMany({
        data: [
            { id: 'cat-shawarma', key: 'shawarma', name: 'Шаурма', sortOrder: 0 },
            { id: 'cat-sides', key: 'sides', name: 'Гарниры', sortOrder: 1 },
            { id: 'cat-drinks', key: 'drinks', name: 'Напитки', sortOrder: 2 },
            { id: 'cat-sauces', key: 'sauces', name: 'Соусы', sortOrder: 3 },
        ],
    });
    const catalogExtras = [
        ...shawarmaExtras,
        { key: 'cheese-sauce', name: 'Сырный соус', price: 40 },
        { key: 'ketchup', name: 'Кетчуп', price: 20 },
        { key: 'garlic-dip', name: 'Чесночный дип', price: 40 },
        { key: 'bbq-dip', name: 'BBQ дип', price: 40 },
    ];
    await prisma.menuExtra.createMany({
        data: catalogExtras.map((e) => ({
            id: `mex-${e.key}`,
            key: e.key,
            name: e.name,
            price: e.price,
        })),
    });
    const demo = await prisma.user.create({
        data: {
            id: 'user-1',
            phone: '+79991234567',
            name: 'Демо',
            passwordHash: demoHash,
            role: 'CUSTOMER',
        },
    });
    await prisma.user.create({
        data: {
            phone: '+79990000000',
            name: 'Владелец',
            passwordHash: demoHash,
            role: 'OWNER',
        },
    });
    await prisma.user.create({
        data: {
            phone: '+79990000001',
            name: 'Менеджер',
            passwordHash: demoHash,
            role: 'MANAGER',
        },
    });
    for (const p of products) {
        await prisma.product.create({
            data: {
                id: p.id,
                name: p.name,
                description: p.description,
                price: p.price,
                weight: p.weight,
                category: p.category,
                image: p.image,
                popular: (_a = p.popular) !== null && _a !== void 0 ? _a : false,
                ingredients: {
                    create: ((_b = p.ingredients) !== null && _b !== void 0 ? _b : []).map((i) => ({
                        key: i.key,
                        name: i.name,
                    })),
                },
                extras: {
                    create: ((_c = p.extras) !== null && _c !== void 0 ? _c : []).map((e) => ({
                        key: e.key,
                        name: e.name,
                        price: e.price,
                    })),
                },
            },
        });
    }
    const minutesAgo = (m) => new Date(Date.now() - m * 60000);
    const seedOrders = [
        {
            id: 'ORD-1042',
            customerName: 'Алексей',
            customerPhone: '+7 900 111-22-33',
            status: 'new',
            createdAt: minutesAgo(3),
            items: [
                { productId: 'classic', name: 'Классическая', price: 320, qty: 2 },
                { productId: 'cola', name: 'Кола', price: 120, qty: 1 },
            ],
        },
        {
            id: 'ORD-1041',
            customerName: 'Мария',
            status: 'cooking',
            createdAt: minutesAgo(18),
            items: [
                { productId: 'spicy', name: 'Острая', price: 350, qty: 1 },
                { productId: 'fries', name: 'Картофель фри', price: 150, qty: 1 },
                { productId: 'ayran', name: 'Айран', price: 100, qty: 1 },
            ],
        },
        {
            id: 'ORD-1040',
            customerName: 'Игорь',
            status: 'ready',
            createdAt: minutesAgo(45),
            userId: demo.id,
            items: [
                { productId: 'beef', name: 'Говяжья', price: 420, qty: 1 },
                { productId: 'bbq', name: 'BBQ', price: 50, qty: 1 },
            ],
        },
    ];
    for (const order of seedOrders) {
        const total = order.items.reduce((s, i) => s + i.price * i.qty, 0);
        await prisma.order.create({
            data: {
                id: order.id,
                userId: order.userId,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                total,
                status: order.status,
                createdAt: order.createdAt,
                items: {
                    create: order.items.map((item) => ({
                        productId: item.productId,
                        name: item.name,
                        price: item.price,
                        qty: item.qty,
                        removedIngredientIds: [],
                        extraIds: [],
                    })),
                },
            },
        });
    }
    await prisma.appConfig.createMany({
        data: [
            { key: 'supportPhone', value: '+79991234567' },
            { key: 'minOrderTotal', value: 0 },
            {
                key: 'orderSla',
                value: { greenMinutes: 10, yellowMinutes: 40 },
            },
        ],
    });
    console.log('Seed completed');
    console.log('Demo customer: +79991234567 / 123456');
    console.log('Demo owner:    +79990000000 / 123456');
    console.log('Demo manager:  +79990000001 / 123456');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
