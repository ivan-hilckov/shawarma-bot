# Простой план создания Telegram Mini App

Telegram Mini Apps представляют собой веб-приложения, интегрированные непосредственно в мессенджер и работающие через специальный API. Они позволяют создавать полноценные приложения, которые запускаются прямо в интерфейсе Telegram без необходимости установки дополнительного ПО[1][5].

## Подготовительный этап

Создайте Telegram-бота через @BotFather, используя команду `/newbot`. Задайте название и уникальное имя бота, получите API-токен, который понадобится для дальнейшей работы[6][16]. Этот бот станет точкой входа для вашего мини-приложения.

## Разработка веб-приложения

Создайте веб-приложение, используя стандартные технологии HTML, CSS и JavaScript[1][5]. Обязательно подключите официальный скрипт Telegram в секции `<head>`:

```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

Это предоставит доступ к объекту `window.Telegram.WebApp` с необходимыми методами и свойствами[2].

## Стилизация под Telegram

Используйте CSS-переменные Telegram API для соответствия теме пользователя. Доступны переменные `--tg-theme-bg-color`, `--tg-theme-text-color`, `--tg-theme-button-color` и другие[2][18]. Убедитесь, что интерфейс адаптивен и оптимизирован для мобильных устройств[8].

## Интеграция с Telegram API

Реализуйте получение данных пользователя через `Telegram.WebApp.initData` и настройте аутентификацию для проверки подлинности пользователей[2]. Добавьте обработку событий и взаимодействие с ботом при необходимости.

## Размещение приложения

Разместите веб-приложение на хостинге с поддержкой HTTPS. Для разработки можно использовать тестовое окружение Telegram, которое поддерживает HTTP-ссылки[13]. Для production обязательно используйте только HTTPS.

## Настройка бота

Свяжите веб-приложение с ботом через @BotFather двумя способами:

- Используйте команду `/setmenubutton` для создания кнопки в меню бота[8][12]
- Или создайте полноценное мини-приложение командой `/newapp` для получения прямой ссылки вида `t.me/botname/appname`[13][20]

## Тестирование и развертывание

Протестируйте приложение в различных устройствах и браузерах. Убедитесь в корректной работе всех функций, включая передачу данных между веб-приложением и ботом[6]. После успешного тестирования разверните приложение в production-среде.

## Заключение

Создание Telegram Mini App представляет собой относительно простой процесс, требующий базовых знаний веб-разработки. Главные преимущества - интеграция в экосистему Telegram, быстрый доступ пользователей без установки дополнительных приложений и возможность использования встроенных функций мессенджера, включая платежную систему[10][11].

Sources
[1] Как создать Telegram Web App: инструкция по разработке Mini App https://cloud.ru/blog/kak-sozdat-telegram-web-app
[2] riobits/Telegram-Web-API-Cheatsheet - GitHub https://github.com/riobits/Telegram-Web-API-Cheatsheet
[3] Top 10 Telegram Mini Apps in 2025 - PropellerAds https://propellerads.com/blog/adv-best-telegram-mini-apps/
[4] Adding A Web App To Your Telegram Bot: A Step-by-step Guide https://www.youtube.com/watch?v=xKXUxTItfK4
[5] Telegram Web application: a detailed guide from AdsGram https://adsgram.ai/telegram-web-application-a-detailed-guide-from-adsgram/
[6] Как создать веб-приложение на базе Telegram Mini Apps - Selectel https://selectel.ru/blog/tutorials/telegram-mini-apps/
[7] TMA launch tutorial | The Open Network https://docs.ton.org/v3/guidelines/dapps/tma/tutorials/step-by-step-guide
[8] Создание telegram web apps и взаимодействие с ними в ... - Habr https://habr.com/ru/articles/666278/
[9] NekitCorp/telegram-web-app-playground - GitHub https://github.com/NekitCorp/telegram-web-app-playground
[10] Техническое задание на создание Telegram Mini Apps https://ridis.ru/primeryi-tz/texnicheskoe-zadanie-na-sozdanie-telegram-mini-apps/
[11] Telegram Web App: Разработка, Примеры, API, Боты и Руководства https://marketolog.mts.ru/blog/telegram-web-app-chto-eto-i-kak-pomogaet-biznesu
[12] Как добавить кнопку открытия веб-приложения Telegram https://sendpulse.com/ru/knowledge-base/chatbot/telegram/telegram-mini-app
[13] Creating New App | Telegram Mini Apps https://docs.telegram-mini-apps.com/platform/creating-new-app
[14] Ultimate 2025 Guide for Telegram Web - InviteMember Blog https://blog.invitemember.com/ultimate-2024-guide-for-telegram-web/
[15] revenkroz/telegram-web-app-bot-example - GitHub https://github.com/revenkroz/telegram-web-app-bot-example
[16] Подробная пошаговая инструкция по созданию [ регистрации ... https://vc.ru/telegram/1505656-podrobnaya-poshagovaya-instrukciya-po-sozdaniyu-registracii-telegram-bota-chat-bota-mini-prilozheniya-v-botfather
[17] This is a demo of the Telegram Mini App. - GitHub https://github.com/shungo0222/telegram-mini-app
[18] Telegram Mini App. Как создать Web App с нуля / Хабр - Habr https://habr.com/ru/companies/amvera/articles/838180/
[19] Создаём Мини-приложение в конструкторе чат-ботов для ... https://www.youtube.com/watch?v=r3tdIi5lXXA
[20] Установка ссылки для Telegram MiniApp - GetCourse https://getcourse.ru/chtm/a/ustanovka-ssilki-dlya-telegram-miniapp
[21] Telegram Web https://web.telegram.org
[22] Подключение и настройка Telegram - База знаний Ботмамы https://docs.botmother.ru/article/40977
[23] Telegram Web App: разработка, стоимость, плюсы и минусы https://www.purrweb.com/ru/blog/chto-takoe-telegram-web-app/
[24] How to Use Telegram Web: Features, Login, and More https://www.cloudemulator.net/blog/telegram-web-application.htm
[25] Разработка Web Apps в Telegram: инструкция - Чат-боты https://chatlabs.ru/razrabotka-web-apps-v-telegram-instrukciya/

# Создание простого Telegram Mini App с использованием HTML, CSS и JavaScript

Telegram Mini Apps представляют собой веб-приложения, интегрированные непосредственно в интерфейс мессенджера. Они позволяют разработчикам создавать интерактивные решения без необходимости установки дополнительного ПО. Ниже представлен пошаговый алгоритм разработки базового приложения с использованием стандартных веб-технологий.

## Подготовка окружения разработки

### Создание Telegram-бота

Инициализация начинается с регистрации бота через @BotFather[4][12]. Используйте команду `/newbot`, чтобы задать имя и получить API-токен. Для связи Mini App с ботом примените команду `/newapp`, создав прямую ссылку вида `t.me/yourbot/yourapp`[4][15]. Альтернативно можно использовать `/setmenubutton` для добавления кнопки запуска веб-интерфейса[5][11].

### Настройка локального сервера

Для тестирования разверните приложение на локальном сервере с поддержкой HTTPS. Инструменты вроде `ngrok` позволяют создать публичный URL, перенаправляющий трафик на локальную машину[3][19]. В production-среде обязателен валидный SSL-сертификат[4][7].

```bash
python3 -m http.server 3000
ngrok http 3000
```

## Разработка веб-интерфейса

### Базовая HTML-структура

Создайте файл `index.html` с минимальным каркасом, подключив официальный SDK Telegram[8][18]:

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>
      body {
        background: var(--tg-theme-bg-color);
        color: var(--tg-theme-text-color);
      }
    </style>
  </head>
  <body>
    <h1>Моё приложение</h1>
    <button id="actionBtn">Выполнить действие</button>
    <script src="script.js"></script>
  </body>
</html>
```

### Стилизация под платформу

Используйте CSS-переменные Telegram для адаптации под тему пользователя[9][16]:

- `--tg-theme-bg-color` — фоновый цвет
- `--tg-theme-text-color` — основной текст
- `--tg-theme-button-color` — цвет кнопок

```css
button {
  background: var(--tg-theme-button-color);
  color: var(--tg-theme-button-text-color);
  padding: 12px 24px;
  border-radius: 8px;
}
```

## Интеграция с Telegram API

### Инициализация приложения

В файле `script.js` обработайте событие готовности приложения[8][18]:

```javascript
Telegram.WebApp.ready();
Telegram.WebApp.expand();
```

### Работа с пользовательскими данными

Получите информацию о пользователе через `initDataUnsafe`[8][10]:

```javascript
const user = Telegram.WebApp.initDataUnsafe.user;
console.log(`Привет, ${user.first_name}!`);
```

### Отправка данных боту

Используйте `sendData` для коммуникации с backend[1][18]:

```javascript
document.getElementById('actionBtn').addEventListener('click', () => {
  Telegram.WebApp.sendData(
    JSON.stringify({
      action: 'confirm',
      timestamp: Date.now(),
    })
  );
  Telegram.WebApp.close();
});
```

## Оптимизация взаимодействия

### Адаптация под мобильные устройства

Настройте viewport и обработку касаний[16][20]:

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
/>
```

```css
@media (hover: none) {
  button {
    min-width: 120px;
    padding: 16px;
  }
}
```

### Обработка изменений темы

Подпишитесь на событие смены темы[9][16]:

```javascript
Telegram.WebApp.onEvent('themeChanged', () => {
  document.body.style.background = Telegram.WebApp.themeParams.bg_color;
});
```

## Развёртывание и тестирование

### Настройка BotFather

Укажите полученный через ngrok URL в настройках бота[3][15]:

1. `/mybots` → Выберите бота
2. `Bot Settings` → `Menu Button`
3. Введите URL вида `https://your-subdomain.ngrok.io`

### Проверка функциональности

Протестируйте все сценарии использования:

- Запуск через прямую ссылку
- Открытие из меню бота
- Передача параметров в `startapp`[3][6]
- Работа в разных темах (Day/Night)

## Расширенные возможности

### Интеграция платежей

Добавьте обработку платежей через Telegram Payments[1][14]:

```javascript
const invoice = {
  title: 'Премиум доступ',
  description: 'Активация на 1 месяц',
  currency: 'USD',
  prices: [{ label: 'Подписка', amount: '499' }],
};

Telegram.WebApp.openInvoice(invoice, status => {
  if (status === 'paid') {
    // Обработка успешной оплаты
  }
});
```

### Работа с аппаратными возможностями

Запросите доступ к геолокации[1][9]:

```javascript
Telegram.WebApp.requestAccessToLocation('primary', granted => {
  if (granted) {
    navigator.geolocation.getCurrentPosition(showPosition);
  }
});
```

## Оптимизация производительности

### Ленивая загрузка ресурсов

Используйте динамический импорт для тяжёлых модулей[6][16]:

```javascript
const loadModule = async () => {
  const module = await import('./heavyModule.js');
  module.initialize();
};
```

### Кэширование статики

Добавьте Service Worker для оффлайн-работы[6][20]:

```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

## Заключение

Представленный подход позволяет создать базовое Mini App за несколько часов. Ключевые аспекты успешной реализации включают строгое соблюдение гайдлайнов Telegram, тестирование на реальных устройствах и постепенное наращивание функциональности. Использование современных веб-технологий в сочетании с Telegram API открывает возможности для создания полноценных бизнес-решений, интегрированных в экосистему мессенджера[12][20].

Sources
[1] Telegram Mini Apps https://core.telegram.org/bots/webapps
[2] Methods | Telegram Mini Apps https://docs.telegram-mini-apps.com/platform/methods
[3] This is a demo of the Telegram Mini App. - GitHub https://github.com/shungo0222/telegram-mini-app
[4] Creating New App | Telegram Mini Apps https://docs.telegram-mini-apps.com/platform/creating-new-app
[5] Creating telegram web app and interacting with them https://blog.mihailgok.ru/en/creating-telegram-web-apps/
[6] TMA examples | The Open Network - TON Blockchain documentation https://docs.ton.org/v3/guidelines/dapps/tma/tutorials/app-examples
[7] Как создать веб-приложение на базе Telegram Mini Apps - Selectel https://selectel.ru/blog/tutorials/telegram-mini-apps/
[8] riobits/Telegram-Web-API-Cheatsheet - GitHub https://github.com/riobits/Telegram-Web-API-Cheatsheet
[9] Theming - Telegram Mini Apps https://docs.telegram-mini-apps.com/platform/theming
[10] Init Data | Telegram Mini Apps https://docs.telegram-mini-apps.com/platform/init-data
[11] how can I add menu button in telegram bot - Stack Overflow https://stackoverflow.com/questions/72594564/how-can-i-add-menu-button-in-telegram-bot
[12] A Beginner's Guide to Telegram Mini Apps - Octa Labs Insights https://blog.octalabs.com/a-beginners-guide-to-telegram-mini-apps-a201cd9d7510
[13] Telegram Mini Apps: Home https://docs.telegram-mini-apps.com
[14] Web events - Telegram APIs https://core.telegram.org/api/web-events
[15] How to Build a Telegram Mini App with Reown AppKit? https://reown.com/blog/how-to-build-a-telegram-mini-app
[16] Viewport | Telegram Mini Apps https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk/2-x/components/viewport
[17] Mini Apps on Telegram https://core.telegram.org/api/bots/webapps
[18] How to send data in Telegram WebApp Bot without external HTTP ... https://blog.jora.dev/en/posts/how-to-send-data-with-telegram-webapp-on-aiogram-python
[19] revenkroz/telegram-web-app-bot-example - GitHub https://github.com/revenkroz/telegram-web-app-bot-example
[20] Как создать Telegram Web App: инструкция по разработке Mini App https://cloud.ru/blog/kak-sozdat-telegram-web-app
[21] Создание telegram web apps и взаимодействие с ними в ... - Habr https://habr.com/ru/articles/666278/
[22] Создаем Telegram Web App. Часть I: разработка на React Native ... https://websecret.by/blog/razrabotka/sozdaem-telegram-web-app-chast-i-razrabotka-na-react-native-web
[23] Telegram Mini App. Как создать Web App с нуля / Хабр - Habr https://habr.com/ru/companies/amvera/articles/838180/
[24] Делаем авторизацию в Telegram Mini Apps правильно - Habr https://habr.com/ru/articles/889270/
[25] react-telegram-web-app/docs/README.md at master · vkruglikov ... https://github.com/vkruglikov/react-telegram-web-app/blob/master/docs/README.md
[26] Как добавить кнопку «Меню» боту в Telegram? - Unisender https://www.unisender.com/ru/blog/kak-dobavit-knopku-menyu-botu-v-telegram/
[27] Telegram WebApp, часть 2 #easyit #telegrambot #js ... - YouTube https://www.youtube.com/watch?v=eFOFec6vZ7M
[28] Telegram WebApp Integration Features in MedSync https://docs.medsync.botfather.dev/telegram/
[29] vkruglikov/react-telegram-web-app: React components for ... - GitHub https://github.com/vkruglikov/react-telegram-web-app
[30] Создаем Telegram Web App. Часть I: разработка на React Native ... https://habr.com/ru/articles/846516/
[31] telegram bot webapp initData() is empty on Google app script and ... https://stackoverflow.com/questions/74843361/telegram-bot-webapp-initdata-is-empty-on-google-app-script-and-mainbutton-oncl
[32] InitData | Telegram Mini Apps https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk/1-x/components/init-data
[33] ThemeParams | Telegram Mini Apps https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk/1-x/components/theme-params
[34] Как получить initData (startParams) в telegram mini app на React? https://qna.habr.com/q/1377480
[35] Bot menu button - Telegram APIs https://core.telegram.org/api/bots/menu
[36] How to set Telegram menu buttons - SaleSmartly-EN https://help-en.salesmartly.com/docs/qgYjf3
[37] Launch @BotFather - Telegram https://telegram.me/BotFather
[38] Настройка Telegram-бота - Документация Loyalhub https://docs.loyalhub.ru/veb-prilozhenie-v-telegram/nastroika-telegram-bota
[39] Команды BotFather и ботов Telegram - Чат-боты https://chatlabs.ru/komandy-botfather-i-botov-telegram/
[40] Create a Powerful Telegram Chatbot with HTML, CSS ... - YouTube https://www.youtube.com/watch?v=xZtonpj8Yk4

# Создание простого Telegram Mini App с использованием HTML, CSS и JavaScript: пошаговое руководство

Telegram Mini Apps предоставляют разработчикам уникальную возможность создавать интерактивные веб-приложения, полностью интегрированные в интерфейс мессенджера. Эта технология позволяет использовать стандартные веб-технологии для разработки, сохраняя при этом нативный пользовательский опыт[4][5].

## 1. Создание Telegram-бота через BotFather

Первым этапом разработки Mini App является регистрация бота-посредника, который будет служить точкой входа для приложения. Для этого необходимо:

1. Открыть официального бота @BotFather в Telegram[1][3].
2. Отправить команду `/newbot` и следовать инструкциям:
   - Указать читаемое имя бота (например, "Мой мини-приложение")
   - Задать уникальный username с суффиксом `bot` (например, `my_mini_app_bot`)[9][17].

После успешного создания BotFather предоставит API-токен вида `123456789:ABCdefGHIjklMNOpqrSTUvwxYZ`, который необходим для дальнейшей интеграции[14][19]. Пример ответа BotFather:

```
Done! Congratulations on your new bot. You will find it at t.me/my_mini_app_bot. Use this token to access the HTTP API: 123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
```

## 2. Разработка базового веб-приложения

Основу Mini App составляет веб-приложение, созданное с использованием стандартного стека технологий:

**index.html**

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <div id="app">
      <h1>Привет, <span id="username"></span>!</h1>
      <button onclick="handleButtonClick()">Нажми меня</button>
    </div>
    <script src="app.js"></script>
  </body>
</html>
```

**styles.css**

```css
body {
  background: var(--tg-theme-bg-color);
  color: var(--tg-theme-text-color);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  padding: 20px;
}

button {
  background: var(--tg-theme-button-color);
  color: var(--tg-theme-button-text-color);
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
}
```

**app.js**

```javascript
const tg = window.Telegram.WebApp;

tg.expand(); // Раскрыть приложение на весь экран

// Инициализация данных пользователя
const user = tg.initDataUnsafe.user;
document.getElementById('username').textContent = user.first_name;

function handleButtonClick() {
  tg.sendData(JSON.stringify({ action: 'button_click' }));
  tg.close(); // Закрыть приложение после действия
}
```

Ключевые особенности реализации:

- Подключение официального SDK Telegram через `<script>`[5][15]
- Использование CSS-переменных для тематического оформления[8][13]
- Работа с объектом `window.Telegram.WebApp` для взаимодействия с API[18][20]

## 3. Интеграция с Telegram API

Для полноценной работы приложения необходимо реализовать:

**Аутентификация пользователя**

```javascript
const initData = tg.initData;
// Отправка данных на сервер для проверки подлинности
fetch('/validate', {
  method: 'POST',
  body: JSON.stringify({ initData }),
  headers: { 'Content-Type': 'application/json' },
});
```

**Обработка темы оформления**

```javascript
tg.onEvent('themeChanged', () => {
  document.body.style.background = tg.themeParams.bg_color;
});
```

**Работа с аппаратными возможностями**

```javascript
// Запрос доступа к геолокации
tg.requestAccessToGeolocation().then(granted => {
  if (granted) {
    navigator.geolocation.getCurrentPosition(pos => {
      console.log('Координаты:', pos.coords);
    });
  }
});
```

## 4. Настройка хостинга и безопасности

Для размещения Mini App требуется:

- HTTPS-сервер (для production)
- Заголовки безопасности:
  ```
  Content-Security-Policy: default-src 'self' https://telegram.org;
  X-Content-Type-Options: nosniff
  ```
- Отключение кэширования через meta-теги[5]:
  ```html
  <meta http-equiv="Cache-Control" content="no-store, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  ```

## 5. Привязка приложения к боту

Через @BotFather выполните:

1. `/mybots` → выбор вашего бота
2. `Bot Settings` → `Menu Button`
3. Укажите URL вашего приложения (например, `https://your-domain.com/mini-app`)

Альтернативно можно использовать Inline-кнопки:

```javascript
bot.sendMessage(chatId, 'Запустить приложение', {
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: 'Открыть',
          web_app: { url: 'https://your-domain.com/mini-app' },
        },
      ],
    ],
  },
});
```

## 6. Расширенные возможности

**Платежи через Telegram**

```javascript
tg.openInvoice(
  {
    title: 'Премиум доступ',
    description: 'Активация на 1 месяц',
    currency: 'USD',
    prices: [{ label: 'Подписка', amount: '500' }],
  },
  result => {
    if (result.status === 'paid') {
      // Обработка успешной оплаты
    }
  }
);
```

**Работа с файлами**

```javascript
tg.requestAccessToFileSystem().then(granted => {
  if (granted) {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = e => {
      const file = e.target.files[0];
      tg.sendFile(file);
    };
    input.click();
  }
});
```

## 7. Тестирование и отладка

Используйте следующие методы:

- Режим разработчика в Telegram: `web_app_debug=true` в URL[20]
- Эмуляция различных устройств через Chrome DevTools
- Тестирование тем оформления:
  ```javascript
  tg.setBackgroundColor('#ffffff');
  tg.setHeaderColor('secondary_bg_color');
  ```

Пример чек-листа для тестирования:

1. Корректное отображение в темной/светлой теме
2. Работа с разными разрешениями экрана
3. Проверка безопасности передачи данных
4. Тестирование платежной системы
5. Валидация входных данных

## 8. Публикация и мониторинг

После тестирования:

1. Разместите приложение на production-сервере
2. Настройте аналитику через:
   ```javascript
   tg.enableAnalytics();
   tg.onEvent('viewportChanged', metrics => {
     console.log('Изменения просмотра:', metrics);
   });
   ```
3. Реализуйте систему обновлений:
   ```javascript
   if ('serviceWorker' in navigator) {
     navigator.serviceWorker.register('/sw.js').then(reg => console.log('SW registered:', reg));
   }
   ```

## Заключение

Создание Telegram Mini App требует внимания к деталям интеграции с экосистемой Telegram, но предоставляет мощные возможности для взаимодействия с пользователями. Ключевые аспекты успешной реализации включают:

1. Строгое соблюдение рекомендаций по дизайну[4][8]
2. Правильную обработку пользовательских данных[6][18]
3. Оптимизацию производительности для мобильных устройств
4. Постепенное внедрение функций через feature flags

Дальнейшее развитие приложения может включать интеграцию с TON Blockchain, использование машинного обучения для персонализации контента и реализацию оффлайн-режима через Service Workers[5][20].

Sources
[1] Инструкция по созданию и настройки бота в BotFather https://docs.radist.online/radist.online-docs/nashi-produkty/radist-web/podklyucheniya/telegram-bot/instrukciya-po-sozdaniyu-i-nastroiki-bota-v-botfather
[2] How to add menu button to your Telegram Bot in 10 seconds. https://www.youtube.com/watch?v=4i9VEOpZaZ0
[3] Instructions for creating and configuring a bot in BotFather https://docs.radist.online/docs/our-products/radist-web/connections/telegram-bot/instructions-for-creating-and-configuring-a-bot-in-botfather
[4] Telegram Mini Apps https://core.telegram.org/bots/webapps
[5] TMA launch tutorial | The Open Network https://docs.ton.org/v3/guidelines/dapps/tma/tutorials/step-by-step-guide
[6] InitData | Telegram Mini Apps https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk/1-x/components/init-data
[7] Theme variables - Core concepts - Tailwind CSS https://tailwindcss.com/docs/theme
[8] How to Build Your First Telegram Mini App: A Step-by-Step Guide https://adsgram.ai/how-to-build-your-first-telegram-mini-app-a-step-by-step-guide/
[9] Как создать своего бота в BotFather? - Botcreators https://botcreators.ru/blog/kak-sozdat-svoego-bota-v-botfather/
[10] how can I add menu button in telegram bot - Stack Overflow https://stackoverflow.com/questions/72594564/how-can-i-add-menu-button-in-telegram-bot
[11] Telegram APIs https://core.telegram.org
[12] types/telegram-web-app - NPM https://www.npmjs.com/package/@types/telegram-web-app
[13] Theming with CSS variables - Prototypr https://blog.prototypr.io/css-variables-90cc4cdf41e9
[14] Создайте своего бота в Телеграм с BotFather - МТС Маркетолог https://marketolog.mts.ru/blog/kak-sozdat-bota-v-botfather-gaid-dlya-novichkov
[15] revenkroz/telegram-web-app-bot-example - GitHub https://github.com/revenkroz/telegram-web-app-bot-example
[16] CSS Variables and Theming | Plugin API - Figma https://www.figma.com/plugin-docs/css-variables/
[17] Как создать бота через BotFather за 5 шагов (статья 2025 года) https://vc.ru/marketing/1872678-kak-sozdat-bota-cherez-botfather-za-5-shagov-statya-2025-goda
[18] riobits/Telegram-Web-API-Cheatsheet - GitHub https://github.com/riobits/Telegram-Web-API-Cheatsheet
[19] Команды BotFather и ботов Telegram - Чат-боты https://chatlabs.ru/komandy-botfather-i-botov-telegram/
[20] Telegram Web App - Pub.dev https://pub.dev/documentation/telegram_web_app/latest/
[21] Как создать нового бота в @botfather и получить его API Token https://sambot.ru/support_kak-sozdat-bota-v-botfather_2
[22] botfather.io | Bots for Android, Browser, and Desktop https://botfather.io
[23] Mini Apps on Telegram https://core.telegram.org/api/bots/webapps
[24] Init Data | Telegram Mini Apps https://docs.telegram-mini-apps.com/platform/init-data
[25] Theme Params - Telegram Mini Apps https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk/3-x/components/theme-params
[26] Theming CSS variables (CSS custom properties) - YouTube https://www.youtube.com/watch?v=TcxWROjyA7U
[27] [v4] Best method to use CSS variables for multiple themes? #15600 https://github.com/tailwindlabs/tailwindcss/discussions/15600
[28] ThemeParams | Telegram Mini Apps https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk/1-x/components/theme-params
[29] How to use CSS variables to create amazing theme transitions https://dev.to/cataon/how-to-use-css-variables-to-create-amazing-theme-transitions-1po9
[30] react-telegram-web-app/docs/README.md at master · vkruglikov ... https://github.com/vkruglikov/react-telegram-web-app/blob/master/docs/README.md

BotGarden – Контекст беседы о Telegram Mini-App

Этот документ агрегирует ключевые решения и технический план, которые мы сформировали в ходе текущего диалога, чтобы их можно было сохранить в проекте BotGarden и далее редактировать коллегами.

⸻

1. Итоги обсуждения
   • Цель: встроить Telegram Mini-App для оформления заказов в существующий бот Shawarma Bot.
   • Стек фронта: React 18 + Vite + TypeScript, Tailwind CSS, @twa-dev/sdk.
   • Бэк: расширяем Fastify-API плагином twaSession для валидации initData и выдачи JWT.
   • Деплой: build mini-app кладётся в public/app/, обслуживается тем же nginx, что и лендинги.
   • CI/CD: отдельный GitHub Action для сборки и выкладки статики.
   • Сроки: 5 недель на одного разработчика.

⸻

2. Полный технический план внедрения (Markdown)

Что действительно нужно (а что — нет)

Была в раннем плане Оставляем? Причина
✏️ «Сделать отдельный мобиль-web сайт» ❌ Mini-app уже web-оболочка внутри Telegram.
✏️ Figma-макеты в нескольких брейк-пойнтах ❌ Telegram Web Apps всегда во «full-width»; достаточно одного макета.
✅ Проверка initData + server-side валидация ✔️ Критично: клиент присылает только initData, всё остальное — на бэке.
✅ CI/CD под Docker ✔️ В репо уже Docker-оркестрация — нужно вписать mini-app в существующий пайплайн.
✏️ «Выбор между React/Vue/Svelte» ❌ В проекте Node + TypeScript → берём React 18 + Vite.
✅ Хранить build вместе с лендингами ✔️ Статика лежит рядом в public/.

⸻

Архитектура

Telegram → Shawarma Mini-App (React)
│
└── nginx ─► Fastify API ─► Postgres / Redis
▲
└── Telegraf Bot

Front-end
• React 18 + Vite + TS
• @twa-dev/sdk
• Tailwind CSS + Headless UI
• TanStack Query
• Zod для валидации схем

Back-end (существующий Fastify)
• Плагин twaSession.ts 1. Проверка подписи hash (HMAC-SHA256(botToken)) 2. Выдача JWT (15 мин) 3. Middleware блокирует запросы без JWT

Бот (Telegraf)
• /order → кнопка «Заказать» с web_app.url
• Deep-link: https://t.me/<bot>?startapp=menu

Деплой фронта
• Build падает в public/app/
• nginx alias:

location /app/ {
alias /var/www/shawarma-bot/public/app/;
try_files $uri /app/index.html;
}

⸻

Пошаговый план внедрения

Этап 0 — подготовка 1. packages/webapp/ (Vite + React template) 2. Подключить workspaces 3. ESLint/Prettier общие

Этап 1 — MVP mini-app 1. @twa-dev/sdk, Tailwind 2. Типы меню из src/types.ts 3. Экраны: категории → товары, корзина, POST /api/orders

Этап 2 — безопасность 1. verifyInitData() 2. Fastify-плагин twaSession 3. JWT-аутентификация

Этап 3 — интеграция бота 1. Новая клавиатура и deep-link 2. Fallback для старых клиентов

Этап 4 — CI/CD 1. GitHub Action build-miniapp.yml 2. Распаковка в public/app 3. Обновление nginx.conf 4. BotFather → Web App URL

Этап 5 — тесты
• Unit: Vitest + React Testing Library
• E2E: Playwright (telegram-mocks)
• Contract: Jest для /api/twa/auth

Этап 6 — мониторинг
• @fastify/metrics
• Rate-limit nginx
• Alert в Grafana: api_twa_auth_failures > 5/min

⸻

Правка LANDING_PAGES.md

### 🛒 /app/ — Telegram mini-app

URL: https://botgarden.store/app  
Назначение: оформление заказа внутри Telegram  
Сборка: `packages/webapp` → `public/app`

⸻

Дорожная карта

Неделя Результат
1 Skeleton UI + deep-link
2 Полный UI + корзина
3 JWT + initData валидация
4 CI/CD, staging
5 E2E тесты, production

Итого: ≈ 5 недель на одного разработчика.
