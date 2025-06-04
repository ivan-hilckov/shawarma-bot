# 🤝 Руководство по внесению вклада

Добро пожаловать в проект Shawarma Bot! Мы рады вашему желанию внести вклад в развитие проекта.

---

## 🎯 Как внести вклад

### Типы вклада

Мы приветствуем следующие типы вклада:

- 🐛 **Исправление багов** - найденные и исправленные ошибки
- ✨ **Новые функции** - добавление новой функциональности
- 📝 **Документация** - улучшение и дополнение документации
- 🧪 **Тесты** - добавление тестов и улучшение покрытия
- 🎨 **UI/UX** - улучшение пользовательского интерфейса
- ⚡ **Производительность** - оптимизация скорости и ресурсов
- 🔧 **Инфраструктура** - улучшение CI/CD, Docker, деплоя

---

## 🚀 Быстрый старт

### 1. Подготовка окружения

```bash
# Форк репозитория на GitHub
git clone https://github.com/YOUR_USERNAME/shawarma-bot.git
cd shawarma-bot

# Установка зависимостей
npm install

# Настройка окружения
cp .env.example .env
# Добавьте ваш BOT_TOKEN и другие настройки
```

### 2. Запуск в режиме разработки

```bash
# Запуск с Docker (рекомендуется)
docker-compose up -d

# Или локально
npm run dev          # Bot
npm run dev:api      # API (в отдельном терминале)
```

### 3. Проверка работоспособности

```bash
# Запуск тестов
npm test

# Проверка линтера
npm run lint

# Проверка типов
npm run type-check
```

---

## 📋 Процесс разработки

### Создание фичи

1. **Создайте issue**

   - Опишите проблему или предлагаемую функцию
   - Дождитесь обсуждения и одобрения

2. **Создайте branch**

   ```bash
   git checkout -b feature/your-feature-name
   # или
   git checkout -b fix/bug-description
   ```

3. **Разработка**

   - Следуйте стандартам кодирования
   - Добавьте тесты для нового кода
   - Обновите документацию при необходимости

4. **Тестирование**

   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

5. **Создайте Pull Request**
   - Опишите изменения
   - Ссылайтесь на связанные issues
   - Добавьте скриншоты для UI изменений

### Типы веток

- `feature/` - новые функции
- `fix/` - исправления багов
- `docs/` - изменения документации
- `refactor/` - рефакторинг кода
- `test/` - добавление тестов
- `chore/` - обновления зависимостей, конфигурации

---

## 📝 Стандарты кодирования

### TypeScript

```typescript
// ✅ Хорошо
interface User {
  id: number;
  name: string;
  email?: string;
}

async function getUserById(id: number): Promise<User | null> {
  try {
    const user = await database.findUser(id);
    return user;
  } catch (error) {
    logger.error('Failed to get user:', { id, error });
    return null;
  }
}

// ❌ Плохо
function getUser(id: any) {
  const user = database.findUser(id);
  return user;
}
```

### Именование

```typescript
// Переменные и функции - camelCase
const userName = 'john';
function getUserData() {}

// Константы - SCREAMING_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;

// Классы и интерфейсы - PascalCase
class UserService {}
interface DatabaseConfig {}

// Типы - PascalCase с суффиксом Type
type UserDataType = {
  id: number;
  name: string;
};
```

### Комментарии

```typescript
/**
 * Получает информацию о пользователе по ID
 * @param userId - ID пользователя в системе
 * @returns Promise с данными пользователя или null если не найден
 */
async function getUserInfo(userId: number): Promise<User | null> {
  // Проверяем валидность ID
  if (userId <= 0) {
    return null;
  }

  // TODO: Добавить кэширование
  return await database.findUser(userId);
}
```

---

## 🧪 Тестирование

### Написание тестов

```typescript
// __tests__/user.test.ts
describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  it('should return user by valid ID', async () => {
    // Arrange
    const userId = 123;
    const expectedUser = { id: userId, name: 'John' };
    jest.spyOn(database, 'findUser').mockResolvedValue(expectedUser);

    // Act
    const result = await userService.getUserById(userId);

    // Assert
    expect(result).toEqual(expectedUser);
    expect(database.findUser).toHaveBeenCalledWith(userId);
  });

  it('should return null for invalid ID', async () => {
    // Act
    const result = await userService.getUserById(-1);

    // Assert
    expect(result).toBeNull();
  });
});
```

### Типы тестов

1. **Unit тесты** - изолированные функции и классы

   ```bash
   npm test -- unit/
   ```

2. **API тесты** - endpoints и интеграции

   ```bash
   npm test -- api/
   ```

3. **Component тесты** - основная функциональность
   ```bash
   npm test -- handlers.test.ts
   ```

### Покрытие тестами

- Минимум 80% для новых функций
- 100% для критических компонентов
- Тесты на happy path и edge cases

```bash
npm run test:coverage
```

---

## 📖 Документация

### Обновление README

При добавлении новых функций обновите:

- Раздел "Основные возможности"
- Примеры использования
- Команды запуска

### Создание документации

```markdown
# docs/NEW_FEATURE.md

# 🆕 Новая функция

Описание новой функции и как ее использовать.

## Быстрый старт

<!-- Примеры кода -->

## API Reference

<!-- Документация API -->
```

### Комментарии в коде

````typescript
/**
 * Сервис для управления заказами
 *
 * @example
 * ```typescript
 * const orderService = new OrderService();
 * const order = await orderService.createOrder(userId, items);
 * ```
 */
export class OrderService {
  /**
   * Создает новый заказ
   * @param userId - ID пользователя
   * @param items - Список товаров
   * @returns Promise с ID созданного заказа
   */
  async createOrder(userId: number, items: CartItem[]): Promise<string> {
    // реализация
  }
}
````

---

## 🔍 Code Review

### Чек-лист для автора PR

- [ ] Код следует стандартам проекта
- [ ] Добавлены тесты для нового кода
- [ ] Все тесты проходят
- [ ] Документация обновлена
- [ ] Нет console.log и отладочного кода
- [ ] TypeScript ошибок нет
- [ ] ESLint ошибок нет

### Чек-лист для ревьюера

- [ ] Код понятен и читаем
- [ ] Архитектурные решения обоснованы
- [ ] Производительность не пострадала
- [ ] Безопасность учтена
- [ ] Тесты покрывают новую функциональность
- [ ] Документация актуальна

### Процесс review

1. **Автор создает PR**
2. **Автоматические проверки** (CI/CD)
3. **Ревью от команды** (минимум 1 одобрение)
4. **Исправление замечаний**
5. **Merge в main ветку**

---

## 🚨 Reporting Issues

### Баг репорты

```markdown
**Описание бага**
Четкое описание проблемы.

**Шаги для воспроизведения**

1. Перейти в '...'
2. Нажать на '....'
3. Скроллить до '....'
4. Увидеть ошибку

**Ожидаемое поведение**
Что должно было произойти.

**Скриншоты**
Если применимо, добавьте скриншоты.

**Окружение:**

- OS: [e.g. Ubuntu 20.04]
- Node.js: [e.g. 18.17.0]
- Browser: [e.g. Chrome 91]
- Version: [e.g. 3.0.0]

**Дополнительный контекст**
Любая другая информация о проблеме.
```

### Feature requests

```markdown
**Описание функции**
Четкое описание желаемой функции.

**Проблема, которую это решает**
Какую проблему решает эта функция?

**Предложенное решение**
Как вы видите реализацию?

**Альтернативы**
Рассматривали ли другие решения?

**Дополнительный контекст**
Скриншоты, мокапы, примеры из других проектов.
```

---

## 🔧 Настройка инструментов

### VS Code настройки

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### Git hooks

```bash
# Установка pre-commit hooks
npm run prepare

# hooks автоматически запускают:
# - ESLint
# - Prettier
# - TypeScript проверки
# - Быстрые тесты
```

### Полезные команды

```bash
# Разработка
npm run dev:watch          # Hot reload для бота
npm run dev:api:watch       # Hot reload для API

# Тестирование
npm run test:watch          # Тесты в watch режиме
npm run test:debug          # Отладка тестов
npm test -- --verbose       # Подробный вывод

# Качество кода
npm run lint:fix            # Автоисправление ESLint
npm run format              # Форматирование Prettier
npm run type-check          # Проверка TypeScript типов

# Docker
npm run docker:build        # Сборка образов
npm run docker:logs         # Просмотр логов
```

---

## 📚 Ресурсы

### Изучение кодовой базы

1. **Начните с README** - понимание проекта
2. **Изучите архитектуру** - [docs/BOT_ARCHITECTURE.md](BOT_ARCHITECTURE.md)
3. **Посмотрите тесты** - понимание поведения
4. **Запустите локально** - эксперименты

### Полезные ссылки

- 📖 **Fastify Docs**: https://www.fastify.io/docs/
- 🤖 **Telegram Bot API**: https://core.telegram.org/bots/api
- 🧪 **Jest Docs**: https://jestjs.io/docs/getting-started
- 📝 **TypeScript Handbook**: https://www.typescriptlang.org/docs/

### Обучающие материалы

- **Node.js Best Practices**: https://github.com/goldbergyoni/nodebestpractices
- **TypeScript Deep Dive**: https://basarat.gitbook.io/typescript/
- **Testing Best Practices**: https://github.com/goldbergyoni/javascript-testing-best-practices

---

## 👥 Сообщество

### Связь с командой

- 💬 **GitHub Discussions** - общие вопросы и предложения
- 🐛 **GitHub Issues** - баги и feature requests
- 📧 **Email**: developers@shawarma-bot.com

### Код поведения

Мы придерживаемся принципов:

- 🤝 **Уважение** - к мнению и опыту других
- 🎯 **Конструктивность** - в обратной связи
- 🌟 **Помощь** - новичкам и коллегам
- 📚 **Обучение** - постоянное развитие

### Признание вклада

- Все контрибьюторы упоминаются в CHANGELOG
- Значительный вклад отмечается в README
- Активные участники приглашаются в core team

---

## ❓ FAQ

### Q: Как выбрать задачу для начала?

A: Ищите issues с лейблами `good first issue` или `help wanted`. Это задачи, подходящие для новичков.

### Q: Сколько времени займет review PR?

A: Обычно 1-3 рабочих дня. Для urgent fixes - в течение дня.

### Q: Можно ли работать над задачей без issue?

A: Лучше сначала создать issue для обсуждения, особенно для больших изменений.

### Q: Что делать если тесты падают?

A: Проверьте логи ошибок, убедитесь что environment настроен правильно. Если проблема не решается - создайте issue.

---

**Спасибо за ваш вклад в развитие проекта! 🙏**

Каждый коммит делает проект лучше для всех пользователей.
