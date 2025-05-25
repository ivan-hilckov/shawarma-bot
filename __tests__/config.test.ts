// Мокаем dotenv перед импортом config
jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

describe("Config Module", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Сохраняем оригинальные переменные окружения
    originalEnv = process.env;

    // Очищаем кеш модулей для чистого тестирования
    jest.resetModules();
  });

  afterEach(() => {
    // Восстанавливаем переменные окружения
    process.env = originalEnv;
  });

  test("должен использовать переменные окружения если они установлены", async () => {
    // Устанавливаем тестовые переменные окружения
    process.env.BOT_TOKEN = "test_bot_token_123";
    process.env.NODE_ENV = "test";

    // Динамически импортируем config после установки переменных
    const { default: config } = await import("../src/config");

    expect(config.BOT_TOKEN).toBe("test_bot_token_123");
    expect(config.NODE_ENV).toBe("test");
  });

  test("должен использовать значения по умолчанию если переменные не установлены", async () => {
    // Удаляем переменные окружения
    delete process.env.BOT_TOKEN;
    delete process.env.NODE_ENV;

    // Динамически импортируем config
    const { default: config } = await import("../src/config");

    expect(config.BOT_TOKEN).toBe("YOUR_BOT_TOKEN_HERE");
    expect(config.NODE_ENV).toBe("development");
  });

  test("должен экспортировать объект с правильными свойствами", async () => {
    const { default: config } = await import("../src/config");

    expect(config).toHaveProperty("BOT_TOKEN");
    expect(config).toHaveProperty("NODE_ENV");
    expect(typeof config.BOT_TOKEN).toBe("string");
    expect(typeof config.NODE_ENV).toBe("string");
  });
});
