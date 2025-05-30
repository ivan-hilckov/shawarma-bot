import { getMenuByCategory, getItemById, getAllCategories, menu } from '../src/menu';
import { MenuItem } from '../src/types';

describe('Menu Module', () => {
  describe('getMenuByCategory', () => {
    test('должен возвращать шаурму', () => {
      const shawarmaItems = getMenuByCategory('shawarma');

      expect(shawarmaItems).toHaveLength(7);
      expect(shawarmaItems[0]).toEqual({
        id: '1',
        name: 'Шаурма Вегетарианская',
        price: 220,
        description:
          'Сочная шаурма с хрустящими овощами, свежими томатами, огурцами, капустой и ароматными специями. Заправлена йогуртовым соусом с зеленью',
        category: 'shawarma',
        photo: 'assets/xxl-3.jpeg',
      });
    });

    test('должен возвращать напитки', () => {
      const drinkItems = getMenuByCategory('drinks');

      expect(drinkItems).toHaveLength(5);
      expect(drinkItems[0]).toEqual({
        id: '8',
        name: 'Кола',
        price: 100,
        description: 'Освежающая Coca-Cola Classic. Идеально сочетается с любым блюдом',
        category: 'drinks',
      });
    });

    test('должен возвращать пустой массив для несуществующей категории', () => {
      const result = getMenuByCategory('nonexistent');
      expect(result).toEqual([]);
    });
  });

  describe('getItemById', () => {
    test('должен находить товар по ID', () => {
      const item = getItemById('1');

      expect(item).toEqual({
        id: '1',
        name: 'Шаурма Вегетарианская',
        price: 220,
        description:
          'Сочная шаурма с хрустящими овощами, свежими томатами, огурцами, капустой и ароматными специями. Заправлена йогуртовым соусом с зеленью',
        category: 'shawarma',
        photo: 'assets/xxl-3.jpeg',
      });
    });

    test('должен находить напиток по ID', () => {
      const item = getItemById('8');

      expect(item).toEqual({
        id: '8',
        name: 'Кола',
        price: 100,
        description: 'Освежающая Coca-Cola Classic. Идеально сочетается с любым блюдом',
        category: 'drinks',
      });
    });

    test('должен возвращать undefined для несуществующего ID', () => {
      const item = getItemById('999');
      expect(item).toBeUndefined();
    });
  });

  describe('getAllCategories', () => {
    test('должен возвращать все категории', () => {
      const categories = getAllCategories();

      expect(categories).toEqual(['shawarma', 'drinks']);
      expect(categories).toHaveLength(2);
    });
  });

  describe('menu data structure', () => {
    test('должен содержать правильную структуру данных', () => {
      expect(menu).toHaveProperty('shawarma');
      expect(menu).toHaveProperty('drinks');

      // Проверяем что все товары имеют необходимые поля
      const allItems: MenuItem[] = [];
      Object.values(menu).forEach(categoryItems => {
        allItems.push(...categoryItems);
      });

      allItems.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('price');
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('category');

        expect(typeof item.id).toBe('string');
        expect(typeof item.name).toBe('string');
        expect(typeof item.price).toBe('number');
        expect(typeof item.description).toBe('string');
        expect(['shawarma', 'drinks']).toContain(item.category);

        // Поле photo опциональное, но если есть, должно быть строкой
        if (item.photo) {
          expect(typeof item.photo).toBe('string');
        }
      });
    });

    test('все ID должны быть уникальными', () => {
      const allItems: MenuItem[] = [];
      Object.values(menu).forEach(categoryItems => {
        allItems.push(...categoryItems);
      });

      const ids = allItems.map(item => item.id);
      const uniqueIds = [...new Set(ids)];

      expect(ids).toHaveLength(uniqueIds.length);
    });

    test('должен содержать правильные категории товаров', () => {
      const shawarmaItems = menu.shawarma;
      const drinkItems = menu.drinks;

      expect(shawarmaItems).toBeDefined();
      expect(drinkItems).toBeDefined();

      shawarmaItems?.forEach(item => {
        expect(item.category).toBe('shawarma');
      });

      drinkItems?.forEach(item => {
        expect(item.category).toBe('drinks');
      });
    });

    test('должен содержать все основные позиции стандартного меню', () => {
      const shawarmaItems = getMenuByCategory('shawarma');

      // Проверяем что есть все ключевые позиции из упрощенного меню
      const itemNames = shawarmaItems.map(item => item.name);

      expect(itemNames).toContain('Шаурма Вегетарианская');
      expect(itemNames).toContain('Шаурма Классик');
      expect(itemNames).toContain('Шаурма в сырном лаваше');
      expect(itemNames).toContain('Цезарь-Ролл');
      expect(itemNames).toContain('Хот-Дог с сосиской');
      expect(itemNames).toContain('Хот-Дог с курицей');
      expect(itemNames).toContain('Гирос');

      // Проверяем ценовой диапазон упрощенного меню
      const prices = shawarmaItems.map(item => item.price);
      expect(Math.min(...prices)).toBe(190); // Хот-Дог с сосиской
      expect(Math.max(...prices)).toBe(275); // Гирос
    });

    test('товары шаурмы должны иметь фотографии с новыми названиями', () => {
      const shawarmaItems = getMenuByCategory('shawarma');

      // Все товары шаурмы должны иметь фотографии с новыми названиями без пробелов
      shawarmaItems.forEach(item => {
        expect(item.photo).toBeDefined();
        expect(typeof item.photo).toBe('string');
        expect(item.photo).toMatch(/^assets\/xxl-?\d*\.jpeg$/);
      });
    });

    test('напитки могут не иметь фотографий', () => {
      const drinkItems = getMenuByCategory('drinks');

      // Напитки пока без фотографий
      drinkItems.forEach(item => {
        expect(item.photo).toBeUndefined();
      });
    });

    test('должен содержать обновленные описания', () => {
      const shawarmaItems = getMenuByCategory('shawarma');
      const drinkItems = getMenuByCategory('drinks');

      // Проверяем что описания стали более подробными
      shawarmaItems.forEach(item => {
        expect(item.description.length).toBeGreaterThan(20);
        expect(item.description).not.toBe('Стандартная порция');
      });

      drinkItems.forEach(item => {
        expect(item.description.length).toBeGreaterThan(10);
        expect(item.description).not.toMatch(/^\d+ мл$/); // Не просто объем
      });
    });
  });
});
