/**
 * Утилиты для тестов
 */

// Типы для mock функций
export type MockFunction<T extends (...args: any[]) => any = (...args: any[]) => any> =
  jest.MockedFunction<T>;

// Утилита для создания мока логгера для отдельных тестов
export const createMockLogger = () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
});

// Утилита для подавления console вывода в определенных тестах
export const suppressConsole = () => {
  const originalMethods = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
  };

  const mockMethods = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(() => {
    Object.assign(console, mockMethods);
  });

  afterEach(() => {
    Object.assign(console, originalMethods);
  });

  return mockMethods;
};

// Утилита для ожидания асинхронных операций
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Утилита для создания mock данных
export const createMockUser = (overrides?: Partial<any>) => ({
  id: 123,
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  ...overrides,
});

export const createMockMessage = (overrides?: Partial<any>) => ({
  message_id: 1,
  from: createMockUser(),
  chat: { id: 123, type: 'private' },
  date: Date.now(),
  text: 'test message',
  ...overrides,
});

// Утилита для очистки всех моков
export const clearAllMocks = () => {
  jest.clearAllMocks();
};
