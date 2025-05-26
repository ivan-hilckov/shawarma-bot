import { CartService } from "../src/cart";
import { MenuItem } from "../src/types";

// Мокаем Redis клиент
jest.mock("redis", () => ({
  createClient: jest.fn(() => ({
    on: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    setEx: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
  })),
}));

describe("CartService", () => {
  let cartService: CartService;
  let mockRedisClient: any;

  const mockMenuItem: MenuItem = {
    id: "test-item-1",
    name: "Тестовая шаурма",
    description: "Описание тестовой шаурмы",
    price: 250,
    category: "shawarma",
  };

  const mockMenuItem2: MenuItem = {
    id: "test-item-2",
    name: "Тестовый напиток",
    description: "Описание тестового напитка",
    price: 100,
    category: "drinks",
  };

  beforeEach(() => {
    // Создаем новый экземпляр CartService для каждого теста
    cartService = new (CartService as any)();

    // Получаем мок Redis клиента
    mockRedisClient = (cartService as any).client;

    // Сбрасываем все моки
    jest.clearAllMocks();

    // Настраиваем базовые моки
    mockRedisClient.connect.mockResolvedValue(undefined);
    mockRedisClient.disconnect.mockResolvedValue(undefined);
    mockRedisClient.get.mockResolvedValue(null);
    mockRedisClient.setEx.mockResolvedValue("OK");
    mockRedisClient.del.mockResolvedValue(1);
    mockRedisClient.keys.mockResolvedValue([]);
  });

  describe("connect/disconnect", () => {
    it("должен подключаться к Redis", async () => {
      await cartService.connect();
      expect(mockRedisClient.connect).toHaveBeenCalledTimes(1);
    });

    it("не должен подключаться повторно если уже подключен", async () => {
      (cartService as any).isConnected = true;
      await cartService.connect();
      expect(mockRedisClient.connect).not.toHaveBeenCalled();
    });

    it("должен отключаться от Redis", async () => {
      (cartService as any).isConnected = true;
      await cartService.disconnect();
      expect(mockRedisClient.disconnect).toHaveBeenCalledTimes(1);
    });

    it("не должен отключаться если не подключен", async () => {
      (cartService as any).isConnected = false;
      await cartService.disconnect();
      expect(mockRedisClient.disconnect).not.toHaveBeenCalled();
    });
  });

  describe("addToCart", () => {
    it("должен добавлять новый товар в пустую корзину", async () => {
      const userId = 123;

      await cartService.addToCart(userId, mockMenuItem, 2);

      expect(mockRedisClient.connect).toHaveBeenCalled();
      expect(mockRedisClient.get).toHaveBeenCalledWith("cart:123");
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "cart:123",
        3600,
        JSON.stringify([{ menuItem: mockMenuItem, quantity: 2 }])
      );
    });

    it("должен увеличивать количество существующего товара", async () => {
      const userId = 123;
      const existingCart = [{ menuItem: mockMenuItem, quantity: 1 }];

      mockRedisClient.get.mockResolvedValue(JSON.stringify(existingCart));

      await cartService.addToCart(userId, mockMenuItem, 2);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "cart:123",
        3600,
        JSON.stringify([{ menuItem: mockMenuItem, quantity: 3 }])
      );
    });

    it("должен добавлять новый товар к существующим", async () => {
      const userId = 123;
      const existingCart = [{ menuItem: mockMenuItem, quantity: 1 }];

      mockRedisClient.get.mockResolvedValue(JSON.stringify(existingCart));

      await cartService.addToCart(userId, mockMenuItem2, 1);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "cart:123",
        3600,
        JSON.stringify([
          { menuItem: mockMenuItem, quantity: 1 },
          { menuItem: mockMenuItem2, quantity: 1 },
        ])
      );
    });

    it("должен использовать количество по умолчанию (1)", async () => {
      const userId = 123;

      await cartService.addToCart(userId, mockMenuItem);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "cart:123",
        3600,
        JSON.stringify([{ menuItem: mockMenuItem, quantity: 1 }])
      );
    });
  });

  describe("removeFromCart", () => {
    it("должен удалять товар из корзины", async () => {
      const userId = 123;
      const existingCart = [
        { menuItem: mockMenuItem, quantity: 1 },
        { menuItem: mockMenuItem2, quantity: 2 },
      ];

      mockRedisClient.get.mockResolvedValue(JSON.stringify(existingCart));

      await cartService.removeFromCart(userId, mockMenuItem.id);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "cart:123",
        3600,
        JSON.stringify([{ menuItem: mockMenuItem2, quantity: 2 }])
      );
    });

    it("должен удалять ключ корзины если она стала пустой", async () => {
      const userId = 123;
      const existingCart = [{ menuItem: mockMenuItem, quantity: 1 }];

      mockRedisClient.get.mockResolvedValue(JSON.stringify(existingCart));

      await cartService.removeFromCart(userId, mockMenuItem.id);

      expect(mockRedisClient.del).toHaveBeenCalledWith("cart:123");
      expect(mockRedisClient.setEx).not.toHaveBeenCalled();
    });

    it("не должен изменять корзину если товар не найден", async () => {
      const userId = 123;
      const existingCart = [{ menuItem: mockMenuItem, quantity: 1 }];

      mockRedisClient.get.mockResolvedValue(JSON.stringify(existingCart));

      await cartService.removeFromCart(userId, "non-existent-id");

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "cart:123",
        3600,
        JSON.stringify(existingCart)
      );
    });
  });

  describe("updateQuantity", () => {
    it("должен обновлять количество товара", async () => {
      const userId = 123;
      const existingCart = [{ menuItem: mockMenuItem, quantity: 1 }];

      mockRedisClient.get.mockResolvedValue(JSON.stringify(existingCart));

      await cartService.updateQuantity(userId, mockMenuItem.id, 5);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "cart:123",
        3600,
        JSON.stringify([{ menuItem: mockMenuItem, quantity: 5 }])
      );
    });

    it("должен удалять товар если количество <= 0", async () => {
      const userId = 123;
      const existingCart = [{ menuItem: mockMenuItem, quantity: 1 }];

      mockRedisClient.get.mockResolvedValue(JSON.stringify(existingCart));

      // Мокаем removeFromCart
      const removeFromCartSpy = jest
        .spyOn(cartService, "removeFromCart")
        .mockResolvedValue(undefined);

      await cartService.updateQuantity(userId, mockMenuItem.id, 0);

      expect(removeFromCartSpy).toHaveBeenCalledWith(userId, mockMenuItem.id);
    });

    it("не должен изменять корзину если товар не найден", async () => {
      const userId = 123;
      const existingCart = [{ menuItem: mockMenuItem, quantity: 1 }];

      mockRedisClient.get.mockResolvedValue(JSON.stringify(existingCart));

      await cartService.updateQuantity(userId, "non-existent-id", 5);

      // setEx не должен быть вызван для обновления
      expect(mockRedisClient.setEx).not.toHaveBeenCalled();
    });
  });

  describe("getCart", () => {
    it("должен возвращать корзину пользователя", async () => {
      const userId = 123;
      const cartData = [{ menuItem: mockMenuItem, quantity: 2 }];

      mockRedisClient.get.mockResolvedValue(JSON.stringify(cartData));

      const result = await cartService.getCart(userId);

      expect(mockRedisClient.get).toHaveBeenCalledWith("cart:123");
      expect(result).toEqual(cartData);
    });

    it("должен возвращать пустой массив для пустой корзины", async () => {
      const userId = 123;

      mockRedisClient.get.mockResolvedValue(null);

      const result = await cartService.getCart(userId);

      expect(result).toEqual([]);
    });

    it("должен возвращать пустой массив при ошибке парсинга", async () => {
      const userId = 123;

      mockRedisClient.get.mockResolvedValue("invalid-json");

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await cartService.getCart(userId);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error parsing cart data")
      );

      consoleSpy.mockRestore();
    });
  });

  describe("clearCart", () => {
    it("должен очищать корзину пользователя", async () => {
      const userId = 123;

      await cartService.clearCart(userId);

      expect(mockRedisClient.del).toHaveBeenCalledWith("cart:123");
    });
  });

  describe("getCartTotal", () => {
    it("должен вычислять общую стоимость корзины", async () => {
      const userId = 123;
      const cartData = [
        { menuItem: mockMenuItem, quantity: 2 }, // 250 * 2 = 500
        { menuItem: mockMenuItem2, quantity: 1 }, // 100 * 1 = 100
      ];

      mockRedisClient.get.mockResolvedValue(JSON.stringify(cartData));

      const result = await cartService.getCartTotal(userId);

      expect(result).toBe(600);
    });

    it("должен возвращать 0 для пустой корзины", async () => {
      const userId = 123;

      mockRedisClient.get.mockResolvedValue(null);

      const result = await cartService.getCartTotal(userId);

      expect(result).toBe(0);
    });
  });

  describe("getCartItemsCount", () => {
    it("должен подсчитывать общее количество товаров в корзине", async () => {
      const userId = 123;
      const cartData = [
        { menuItem: mockMenuItem, quantity: 2 },
        { menuItem: mockMenuItem2, quantity: 3 },
      ];

      mockRedisClient.get.mockResolvedValue(JSON.stringify(cartData));

      const result = await cartService.getCartItemsCount(userId);

      expect(result).toBe(5);
    });

    it("должен возвращать 0 для пустой корзины", async () => {
      const userId = 123;

      mockRedisClient.get.mockResolvedValue(null);

      const result = await cartService.getCartItemsCount(userId);

      expect(result).toBe(0);
    });
  });

  describe("getActiveCartsCount", () => {
    it("должен возвращать количество активных корзин", async () => {
      mockRedisClient.keys.mockResolvedValue(["cart:123", "cart:456", "cart:789"]);

      const result = await cartService.getActiveCartsCount();

      expect(mockRedisClient.keys).toHaveBeenCalledWith("cart:*");
      expect(result).toBe(3);
    });

    it("должен возвращать 0 если нет активных корзин", async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      const result = await cartService.getActiveCartsCount();

      expect(result).toBe(0);
    });
  });

  describe("getCartKey", () => {
    it("должен генерировать правильный ключ корзины", () => {
      const userId = 123;
      const key = (cartService as any).getCartKey(userId);

      expect(key).toBe("cart:123");
    });
  });

  describe("error handling", () => {
    it("должен обрабатывать ошибки Redis при добавлении в корзину", async () => {
      const userId = 123;

      mockRedisClient.setEx.mockRejectedValue(new Error("Redis error"));

      await expect(cartService.addToCart(userId, mockMenuItem)).rejects.toThrow("Redis error");
    });

    it("должен обрабатывать ошибки Redis при получении корзины", async () => {
      const userId = 123;

      mockRedisClient.get.mockRejectedValue(new Error("Redis error"));

      await expect(cartService.getCart(userId)).rejects.toThrow("Redis error");
    });
  });
});
