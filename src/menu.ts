import { MenuItem } from "./types";

// Простые данные меню для демонстрации
const menu: Record<string, MenuItem[]> = {
  shawarma: [
    {
      id: "1",
      name: "Классическая шаурма",
      price: 250,
      description: "Курица, овощи, соус",
      category: "shawarma",
    },
    {
      id: "2",
      name: "Шаурма большая",
      price: 320,
      description: "Увеличенная порция",
      category: "shawarma",
    },
    {
      id: "3",
      name: "Вегетарианская",
      price: 220,
      description: "Без мяса, с овощами",
      category: "shawarma",
    },
  ],

  drinks: [
    {
      id: "4",
      name: "Кола",
      price: 100,
      description: "330 мл",
      category: "drinks",
    },
    {
      id: "5",
      name: "Сок апельсиновый",
      price: 120,
      description: "250 мл",
      category: "drinks",
    },
    {
      id: "6",
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
