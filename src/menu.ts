import { MenuItem } from "./types";

// Обновленные данные меню
const menu: Record<string, MenuItem[]> = {
  shawarma: [
    {
      id: "1",
      name: "Шаурма Вегетарианская большая",
      price: 270,
      description: "Большая порция вегетарианской шаурмы",
      category: "shawarma",
    },
    {
      id: "2",
      name: "Шаурма Вегетарианская стандарт",
      price: 220,
      description: "Стандартная порция вегетарианской шаурмы",
      category: "shawarma",
    },
    {
      id: "3",
      name: "Шаурма классик двойная",
      price: 350,
      description: "Двойная порция классической шаурмы",
      category: "shawarma",
    },
    {
      id: "4",
      name: "Шаурма классик большая",
      price: 270,
      description: "Большая порция классической шаурмы",
      category: "shawarma",
    },
    {
      id: "5",
      name: "Шаурма классик маленькая",
      price: 220,
      description: "Маленькая порция классической шаурмы",
      category: "shawarma",
    },
    {
      id: "6",
      name: "Шаурма в сырном лаваше стандарт",
      price: 230,
      description: "Шаурма в ароматном сырном лаваше",
      category: "shawarma",
    },
    {
      id: "7",
      name: "Шаурма в сырном лаваше большая",
      price: 280,
      description: "Большая шаурма в сырном лаваше",
      category: "shawarma",
    },
    {
      id: "8",
      name: "Цезарь-Ролл большой",
      price: 300,
      description: "Большой ролл с курицей Цезарь",
      category: "shawarma",
    },
    {
      id: "9",
      name: "Цезарь-Ролл стандарт",
      price: 250,
      description: "Стандартный ролл с курицей Цезарь",
      category: "shawarma",
    },
    {
      id: "10",
      name: "Хот-Дог с сосиской",
      price: 190,
      description: "В лаваше или в булочке",
      category: "shawarma",
    },
    {
      id: "11",
      name: "Хот-Дог с курицей",
      price: 220,
      description: "Хот-дог с нежной курицей",
      category: "shawarma",
    },
    {
      id: "12",
      name: "Гирос",
      price: 275,
      description: "Традиционный греческий гирос",
      category: "shawarma",
    },
  ],

  drinks: [
    {
      id: "13",
      name: "Кола",
      price: 100,
      description: "330 мл",
      category: "drinks",
    },
    {
      id: "14",
      name: "Сок апельсиновый",
      price: 120,
      description: "250 мл",
      category: "drinks",
    },
    {
      id: "15",
      name: "Вода",
      price: 60,
      description: "500 мл",
      category: "drinks",
    },
  ],
};

// Функции для работы с меню
export function getMenuByCategory(category: string): MenuItem[] {
  return menu[category] || [];
}

export function getItemById(id: string): MenuItem | undefined {
  const allItems: MenuItem[] = [];
  Object.values(menu).forEach((categoryItems) => {
    allItems.push(...categoryItems);
  });
  return allItems.find((item) => item.id === id);
}

export function getAllCategories(): string[] {
  return Object.keys(menu);
}

export { menu };
