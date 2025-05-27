module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/*.(test|spec).+(ts|tsx|js)'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '__tests__/setupJest.ts',
    '__tests__/apiSetupJest.ts',
    '__tests__/test-utils.ts',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 10000, // Увеличиваем таймаут для стабильности
  setupFilesAfterEnv: ['<rootDir>/__tests__/setupJest.ts'],

  // Настройки для более чистого вывода
  verbose: false,
  silent: false,

  // Подавляем лишние логи в тестах
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },

  // Устанавливаем переменные окружения для тестов
  setupFiles: [],

  // Настройки покрытия
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/coverage/'],

  // Дополнительные настройки для чистого вывода
  errorOnDeprecated: false,
  clearMocks: true,
  restoreMocks: true,
  // forceExit: true, // Отключено - пытаемся завершиться естественно
};
