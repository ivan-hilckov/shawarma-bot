import { getMenuByCategory, getItemById, getAllCategories, menu } from "../src/menu";
import { MenuItem } from "../src/types";

describe("Menu Module", () => {
  describe("getMenuByCategory", () => {
    test("должен возвращать шаурму", () => {
      const shawarmaItems = getMenuByCategory("shawarma");

      expect(shawarmaItems).toHaveLength(12);
      expect(shawarmaItems[0]).toEqual({
        id: "1",
        name: "Шаурма Вегетарианская большая",
        price: 270,
        description: "Большая порция вегетарианской шаурмы",
        category: "shawarma",
      });
    });

    test("должен возвращать напитки", () => {
      const drinkItems = getMenuByCategory("drinks");

      expect(drinkItems).toHaveLength(3);
      expect(drinkItems[0]).toEqual({
        id: "13",
        name: "Кола",
        price: 100,
        description: "330 мл",
        category: "drinks",
      });
    });

    test("должен возвращать пустой массив для несуществующей категории", () => {
      const result = getMenuByCategory("nonexistent");
      expect(result).toEqual([]);
    });
  });

  describe("getItemById", () => {
    test("должен находить товар по ID", () => {
      const item = getItemById("1");

      expect(item).toEqual({
        id: "1",
        name: "Шаурма Вегетарианская большая",
        price: 270,
        description: "Большая порция вегетарианской шаурмы",
        category: "shawarma",
      });
    });

    test("должен находить напиток по ID", () => {
      const item = getItemById("13");

      expect(item).toEqual({
        id: "13",
        name: "Кола",
        price: 100,
        description: "330 мл",
        category: "drinks",
      });
    });

    test("должен возвращать undefined для несуществующего ID", () => {
      const item = getItemById("999");
      expect(item).toBeUndefined();
    });
  });

  describe("getAllCategories", () => {
    test("должен возвращать все категории", () => {
      const categories = getAllCategories();

      expect(categories).toEqual(["shawarma", "drinks"]);
      expect(categories).toHaveLength(2);
    });
  });

  describe("menu data structure", () => {
    test("должен содержать правильную структуру данных", () => {
      expect(menu).toHaveProperty("shawarma");
      expect(menu).toHaveProperty("drinks");

      // Проверяем что все товары имеют необходимые поля
      const allItems: MenuItem[] = [];
      Object.values(menu).forEach((categoryItems) => {
        allItems.push(...categoryItems);
      });

      allItems.forEach((item) => {
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("name");
        expect(item).toHaveProperty("price");
        expect(item).toHaveProperty("description");
        expect(item).toHaveProperty("category");

        expect(typeof item.id).toBe("string");
        expect(typeof item.name).toBe("string");
        expect(typeof item.price).toBe("number");
        expect(typeof item.description).toBe("string");
        expect(["shawarma", "drinks"]).toContain(item.category);
      });
    });

    test("все ID должны быть уникальными", () => {
      const allItems: MenuItem[] = [];
      Object.values(menu).forEach((categoryItems) => {
        allItems.push(...categoryItems);
      });

      const ids = allItems.map((item) => item.id);
      const uniqueIds = [...new Set(ids)];

      expect(ids).toHaveLength(uniqueIds.length);
    });

    test("должен содержать правильные категории товаров", () => {
      const shawarmaItems = menu.shawarma;
      const drinkItems = menu.drinks;

      expect(shawarmaItems).toBeDefined();
      expect(drinkItems).toBeDefined();

      shawarmaItems?.forEach((item) => {
        expect(item.category).toBe("shawarma");
      });

      drinkItems?.forEach((item) => {
        expect(item.category).toBe("drinks");
      });
    });

    test("должен содержать все новые позиции шаурмы", () => {
      const shawarmaItems = getMenuByCategory("shawarma");

      // Проверяем что есть все ключевые позиции из нового меню
      const itemNames = shawarmaItems.map((item) => item.name);

      expect(itemNames).toContain("Шаурма Вегетарианская большая");
      expect(itemNames).toContain("Шаурма классик двойная");
      expect(itemNames).toContain("Цезарь-Ролл большой");
      expect(itemNames).toContain("Хот-Дог с сосиской");
      expect(itemNames).toContain("Гирос");

      // Проверяем ценовой диапазон
      const prices = shawarmaItems.map((item) => item.price);
      expect(Math.min(...prices)).toBe(190); // Хот-Дог с сосиской
      expect(Math.max(...prices)).toBe(350); // Шаурма классик двойная
    });
  });
});
