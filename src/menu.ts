import { MenuItem } from './types';

// Обновленные данные меню
const menu: Record<string, MenuItem[]> = {
  shawarma: [
    {
      id: '1',
      name: 'Шаурма Вегетарианская',
      price: 220,
      description:
        'Сочная шаурма с хрустящими овощами, свежими томатами, огурцами, капустой и ароматными специями. Заправлена йогуртовым соусом с зеленью',
      category: 'shawarma',
      photo: 'assets/xxl-3.jpeg',
    },
    {
      id: '2',
      name: 'Шаурма Классик',
      price: 220,
      description:
        'Традиционная шаурма с нежным куриным мясом, свежими овощами, маринованными огурчиками и фирменным чесночным соусом в мягком лаваше',
      category: 'shawarma',
      photo: 'assets/xxl-2.jpeg',
    },
    {
      id: '3',
      name: 'Шаурма в сырном лаваше',
      price: 230,
      description:
        'Аппетитная шаурма с сочным мясом в золотистом сырном лаваше. Расплавленный сыр добавляет неповторимый вкус и аромат',
      category: 'shawarma',
      photo: 'assets/xxl-6.jpeg',
    },
    {
      id: '4',
      name: 'Цезарь-Ролл',
      price: 250,
      description:
        'Изысканный ролл с нежным куриным филе, хрустящими листьями салата айсберг, пармезаном и классическим соусом Цезарь',
      category: 'shawarma',
      photo: 'assets/xxl-3.jpeg',
    },
    {
      id: '5',
      name: 'Хот-Дог с сосиской',
      price: 190,
      description:
        'Классический хот-дог с сочной говяжьей сосиской, горчицей, кетчупом и хрустящим луком. На выбор в лаваше или булочке',
      category: 'shawarma',
      photo: 'assets/xxl-7.jpeg',
    },
    {
      id: '6',
      name: 'Хот-Дог с курицей',
      price: 220,
      description:
        'Ароматный хот-дог с нежным куриным филе, свежими овощами и пикантным соусом. Сытно и вкусно!',
      category: 'shawarma',
      photo: 'assets/xxl-1.jpeg',
    },
    {
      id: '7',
      name: 'Гирос',
      price: 275,
      description:
        'Традиционный греческий гирос с маринованной свининой, цацики, красным луком, томатами и картофелем фри в пите',
      category: 'shawarma',
      photo: 'assets/xxl-5.jpeg',
    },
  ],

  drinks: [
    {
      id: '8',
      name: 'Кола',
      price: 100,
      description: 'Освежающая Coca-Cola Classic. Идеально сочетается с любым блюдом',
      category: 'drinks',
    },
    {
      id: '9',
      name: 'Сок апельсиновый',
      price: 120,
      description:
        '100% натуральный апельсиновый сок прямого отжима. Богат витамином C и природной энергией',
      category: 'drinks',
    },
    {
      id: '10',
      name: 'Чай',
      price: 80,
      description: 'Ароматный черный чай высшего сорта. Подается горячим с лимоном и сахаром',
      category: 'drinks',
    },
    {
      id: '11',
      name: 'Кофе',
      price: 120,
      description:
        'Крепкий эспрессо из отборных зерен арабики. Бодрящий вкус для истинных ценителей кофе',
      category: 'drinks',
    },
    {
      id: '12',
      name: 'Вода',
      price: 60,
      description: 'Чистая питьевая вода без газа. Утоляет жажду и освежает',
      category: 'drinks',
    },
  ],
};

// Функции для работы с меню
export function getMenuByCategory(category: string): MenuItem[] {
  return menu[category] || [];
}

export function getItemById(id: string): MenuItem | undefined {
  const allItems: MenuItem[] = [];
  Object.values(menu).forEach(categoryItems => {
    allItems.push(...categoryItems);
  });
  return allItems.find(item => item.id === id);
}

export function getAllCategories(): string[] {
  return Object.keys(menu);
}

export { menu };
