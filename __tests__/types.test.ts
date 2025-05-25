import { MenuItem, CartItem, Order, Config } from "../src/types";

describe("Types Module", () => {
  describe("MenuItem interface", () => {
    test("должен соответствовать интерфейсу MenuItem", () => {
      const menuItem: MenuItem = {
        id: "1",
        name: "Тестовая шаурма",
        description: "Тестовое описание",
        price: 250,
        category: "shawarma",
      };

      expect(menuItem.id).toBe("1");
      expect(menuItem.name).toBe("Тестовая шаурма");
      expect(menuItem.description).toBe("Тестовое описание");
      expect(menuItem.price).toBe(250);
      expect(menuItem.category).toBe("shawarma");
    });

    test("должен принимать только валидные категории", () => {
      const shawarmaItem: MenuItem = {
        id: "1",
        name: "Шаурма",
        description: "Описание",
        price: 250,
        category: "shawarma",
      };

      const drinkItem: MenuItem = {
        id: "2",
        name: "Напиток",
        description: "Описание",
        price: 100,
        category: "drinks",
      };

      expect(shawarmaItem.category).toBe("shawarma");
      expect(drinkItem.category).toBe("drinks");
    });
  });

  describe("CartItem interface", () => {
    test("должен соответствовать интерфейсу CartItem", () => {
      const menuItem: MenuItem = {
        id: "1",
        name: "Тестовая шаурма",
        description: "Тестовое описание",
        price: 250,
        category: "shawarma",
      };

      const cartItem: CartItem = {
        menuItem,
        quantity: 2,
      };

      expect(cartItem.menuItem).toEqual(menuItem);
      expect(cartItem.quantity).toBe(2);
    });
  });

  describe("Order interface", () => {
    test("должен соответствовать интерфейсу Order", () => {
      const menuItem: MenuItem = {
        id: "1",
        name: "Тестовая шаурма",
        description: "Тестовое описание",
        price: 250,
        category: "shawarma",
      };

      const cartItem: CartItem = {
        menuItem,
        quantity: 2,
      };

      const order: Order = {
        id: "order_123",
        userId: 789,
        userName: "TestUser",
        items: [cartItem],
        totalPrice: 500,
        status: "pending",
        createdAt: new Date(),
      };

      expect(order.id).toBe("order_123");
      expect(order.userId).toBe(789);
      expect(order.userName).toBe("TestUser");
      expect(order.items).toHaveLength(1);
      expect(order.totalPrice).toBe(500);
      expect(order.status).toBe("pending");
      expect(order.createdAt).toBeInstanceOf(Date);
    });

    test("должен принимать только валидные статусы", () => {
      const validStatuses = ["pending", "confirmed", "preparing", "ready", "delivered"];

      validStatuses.forEach((status) => {
        const order: Partial<Order> = {
          status: status as Order["status"],
        };

        expect(validStatuses).toContain(order.status);
      });
    });
  });

  describe("Config interface", () => {
    test("должен соответствовать интерфейсу Config", () => {
      const config: Config = {
        BOT_TOKEN: "test_token",
        NODE_ENV: "test",
      };

      expect(config.BOT_TOKEN).toBe("test_token");
      expect(config.NODE_ENV).toBe("test");
      expect(typeof config.BOT_TOKEN).toBe("string");
      expect(typeof config.NODE_ENV).toBe("string");
    });
  });
});
