import { DatabaseService } from "../src/database";
import { CartItem, MenuItem } from "../src/types";

// Мокаем pg модуль
jest.mock("pg", () => ({
  Pool: jest.fn(() => ({
    on: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  })),
}));

describe("DatabaseService", () => {
  let databaseService: DatabaseService;
  let mockPool: any;
  let mockClient: any;

  const mockMenuItem: MenuItem = {
    id: "1",
    name: "Тестовая шаурма",
    description: "Описание тестовой шаурмы",
    price: 250,
    category: "shawarma",
  };

  const mockCartItem: CartItem = {
    menuItem: mockMenuItem,
    quantity: 2,
  };

  beforeEach(() => {
    // Сбрасываем все моки сначала
    jest.clearAllMocks();

    // Создаем мок клиента
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    // Создаем мок пула
    mockPool = {
      on: jest.fn(),
      connect: jest.fn().mockResolvedValue(mockClient),
      end: jest.fn(),
    };

    // Мокаем конструктор Pool
    const { Pool } = require("pg");
    Pool.mockImplementation(() => mockPool);

    // Создаем новый экземпляр DatabaseService
    databaseService = new (DatabaseService as any)();
  });

  describe("constructor", () => {
    it("должен создавать пул подключений", () => {
      const { Pool } = require("pg");
      expect(Pool).toHaveBeenCalledWith({
        connectionString: expect.any(String),
        ssl: false,
      });
    });

    it("должен настраивать обработчики событий", () => {
      expect(mockPool.on).toHaveBeenCalledWith("error", expect.any(Function));
      expect(mockPool.on).toHaveBeenCalledWith("connect", expect.any(Function));
    });
  });

  describe("getClient", () => {
    it("должен возвращать клиент из пула", async () => {
      const client = await databaseService.getClient();

      expect(mockPool.connect).toHaveBeenCalled();
      expect(client).toBe(mockClient);
    });
  });

  describe("disconnect", () => {
    it("должен закрывать пул подключений", async () => {
      await databaseService.disconnect();

      expect(mockPool.end).toHaveBeenCalled();
    });
  });

  describe("upsertUser", () => {
    it("должен создавать или обновлять пользователя", async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      await databaseService.upsertUser(123, "testuser", "Test", "User");

      expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO users"), [
        123,
        "testuser",
        "Test",
        "User",
      ]);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("должен работать с минимальными параметрами", async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      await databaseService.upsertUser(123);

      expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO users"), [
        123,
        undefined,
        undefined,
        undefined,
      ]);
    });

    it("должен освобождать клиент даже при ошибке", async () => {
      mockClient.query.mockRejectedValue(new Error("DB Error"));

      await expect(databaseService.upsertUser(123)).rejects.toThrow("DB Error");
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe("getMenuItemById", () => {
    it("должен возвращать товар по ID", async () => {
      const mockDbItem = {
        id: 1,
        name: "Тестовая шаурма",
        description: "Описание",
        price: "250.00",
        category_name: "shawarma",
      };

      mockClient.query.mockResolvedValue({ rows: [mockDbItem] });

      const result = await databaseService.getMenuItemById("1");

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT mi.*, c.name as category_name"),
        ["1"]
      );
      expect(result).toEqual(mockDbItem);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("должен возвращать null если товар не найден", async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      const result = await databaseService.getMenuItemById("999");

      expect(result).toBeNull();
    });
  });

  describe("createOrder", () => {
    it("должен создавать заказ с элементами", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // upsertUser
        .mockResolvedValueOnce({ rows: [{ id: 42 }] }) // INSERT order
        .mockResolvedValueOnce({ rows: [] }) // INSERT order_item
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const orderId = await databaseService.createOrder(123, [mockCartItem], 500);

      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO orders"),
        [123, 500]
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO order_items"),
        [42, "1", 2, 250]
      );
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(orderId).toBe("42");
    });

    it("должен откатывать транзакцию при ошибке", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // upsertUser
        .mockRejectedValueOnce(new Error("DB Error")); // INSERT order fails

      await expect(databaseService.createOrder(123, [mockCartItem], 500)).rejects.toThrow(
        "DB Error"
      );

      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe("getOrderById", () => {
    it("должен возвращать заказ с элементами", async () => {
      const mockOrderRow = {
        id: 42,
        user_id: 123,
        total_price: "500.00",
        status: "pending",
        created_at: new Date(),
        user_name: "Test User",
      };

      const mockItemRow = {
        menu_item_id: 1,
        name: "Тестовая шаурма",
        description: "Описание",
        price: "250.00",
        quantity: 2,
        category: "shawarma",
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockOrderRow] }) // SELECT order
        .mockResolvedValueOnce({ rows: [mockItemRow] }); // SELECT order_items

      const result = await databaseService.getOrderById("42");

      expect(result).toEqual({
        id: "42",
        userId: 123,
        userName: "Test User",
        items: [
          {
            menuItem: {
              id: "1",
              name: "Тестовая шаурма",
              description: "Описание",
              price: 250,
              category: "shawarma",
            },
            quantity: 2,
          },
        ],
        totalPrice: 500,
        status: "pending",
        createdAt: mockOrderRow.created_at,
      });
    });

    it("должен возвращать null если заказ не найден", async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      const result = await databaseService.getOrderById("999");

      expect(result).toBeNull();
    });
  });

  describe("getUserOrders", () => {
    it("должен возвращать заказы пользователя", async () => {
      const mockOrderRow = {
        id: 42,
        user_id: 123,
        total_price: "500.00",
        status: "pending",
        created_at: new Date(),
        user_name: "Test User",
      };

      const mockItemRow = {
        menu_item_id: 1,
        name: "Тестовая шаурма",
        description: "Описание",
        price: "250.00",
        quantity: 2,
        category: "shawarma",
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockOrderRow] }) // SELECT orders
        .mockResolvedValueOnce({ rows: [mockItemRow] }); // SELECT order_items

      const result = await databaseService.getUserOrders(123, 5);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE o.user_id = $1"),
        [123, 5]
      );
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe("42");
    });

    it("должен использовать лимит по умолчанию", async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      await databaseService.getUserOrders(123);

      expect(mockClient.query).toHaveBeenCalledWith(expect.any(String), [123, 10]);
    });
  });

  describe("updateOrderStatus", () => {
    it("должен обновлять статус заказа", async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      await databaseService.updateOrderStatus("42", "confirmed");

      expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining("UPDATE orders"), [
        "confirmed",
        "42",
      ]);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe("getOrdersStats", () => {
    it("должен возвращать статистику заказов", async () => {
      const mockStatsRow = {
        total_orders: "10",
        pending_orders: "3",
        total_revenue: "2500.00",
      };

      mockClient.query.mockResolvedValue({ rows: [mockStatsRow] });

      const result = await databaseService.getOrdersStats();

      expect(result).toEqual({
        totalOrders: 10,
        pendingOrders: 3,
        totalRevenue: 2500,
      });
    });
  });

  describe("testConnection", () => {
    it("должен возвращать true при успешном подключении", async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      const result = await databaseService.testConnection();

      expect(mockClient.query).toHaveBeenCalledWith("SELECT 1");
      expect(result).toBe(true);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("должен возвращать false при ошибке подключения", async () => {
      mockClient.query.mockRejectedValue(new Error("Connection failed"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await databaseService.testConnection();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Database connection test failed:",
        expect.any(Error)
      );
      expect(mockClient.release).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("error handling", () => {
    it("должен освобождать клиент при ошибках в getMenuItemById", async () => {
      mockClient.query.mockRejectedValue(new Error("DB Error"));

      await expect(databaseService.getMenuItemById("1")).rejects.toThrow("DB Error");
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("должен освобождать клиент при ошибках в updateOrderStatus", async () => {
      mockClient.query.mockRejectedValue(new Error("DB Error"));

      await expect(databaseService.updateOrderStatus("1", "confirmed")).rejects.toThrow("DB Error");
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
