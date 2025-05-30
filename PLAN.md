# План доработки мини-приложения "Шаурма от Райхана"

- [ ] **Добавить клиентский роутинг** между страницами **"Главная"** и **"Список заказов"** на фронтенде с помощью чистого HTML/JS (путём скрытия/показа блоков, без использования фреймворков и сборки).
- [ ] **Добавить кнопку в Telegram-боте** (например, на инлайн-клавиатуре) для запуска **Mini App (WebApp)** прямо из чата.

## 1. Клиентский роутинг на стороне фронтенда

Telegram Mini Apps по сути являются обычными веб‑приложениями, запущенными внутри клиента Telegram. Это означает, что навигацию между разными экранами можно реализовать стандартными методами на HTML/JS, без привлечения сторонних фреймворков. Необходимо сделать две «страницы» – **Главную** и **Список заказов** – в рамках одного HTML‑документа и переключаться между ними, меняя видимость соответствующих блоков.

### Шаги реализации

1. **Разметка HTML**  
   Разделите контент на два контейнера (`<div>`). Один будет соответствовать главной странице, второй – странице списка заказов. Изначально в CSS задайте второму контейнеру `display: none;`, чтобы при загрузке показывалась только главная страница.

   ```html
   <nav>
     <button onclick="showPage('page-main')">Главная</button>
     <button onclick="showPage('page-orders')">Список заказов</button>
   </nav>

   <div id="page-main">
     <!-- Контент главной страницы -->
   </div>

   <div id="page-orders" style="display: none;">
     <!-- Контент страницы заказов -->
   </div>
   ```

2. **Скрипт переключения**

   ```html
   <script>
     function showPage(pageId) {
       document.getElementById('page-main').style.display = 'none';
       document.getElementById('page-orders').style.display = 'none';
       document.getElementById(pageId).style.display = 'block';
     }

     const defaultPage = location.hash === '#orders' ? 'page-orders' : 'page-main';
     showPage(defaultPage);

     window.addEventListener('hashchange', () => {
       if (location.hash === '#orders') {
         showPage('page-orders');
       } else {
         showPage('page-main');
       }
     });
   </script>
   ```

3. **Инициализация Mini App**  
   Подключите скрипт Telegram‑Web‑App:

   ```html
   <head>
     <script src="https://telegram.org/js/telegram-web-app.js"></script>
   </head>
   ```

### Советы по отладке

- Тестируйте навигацию в обычном браузере и в WebView Telegram.
- Проверяйте консоль DevTools на наличие ошибок JavaScript.
- Используйте mobile‑toolbar для проверки адаптивности.

## 2. Кнопка в боте для запуска Mini App

Используем **инлайн‑клавиатуру с кнопкой Web App**.

```typescript
bot.sendMessage(chatId, 'Открыть меню ', {
  reply_markup: {
    inline_keyboard: [
      [{ text: 'Запустить Shawarma App', web_app: { url: 'https://botgarden.store/' } }],
    ],
  },
});
```

> **Важно:** добавьте домен `botgarden.store` через `/setdomain` у **@BotFather**.  
> Без этого Telegram заблокирует открытие WebApp.

### Отладка

1. Перезапустите бота и проверьте сообщение с кнопкой.
2. Убедитесь, что бот отправляет **InlineKeyboard**, а не ReplyKeyboard.
3. При ошибке «Bot domain invalid» проверьте `/setdomain`.

## 3. Итоговое состояние

| Было                              | Стало                                                                      |
| --------------------------------- | -------------------------------------------------------------------------- |
| Одна страница без навигации.      | Две страницы с мгновенным переключением без перезагрузки.                  |
| Нет кнопки запуска WebApp в боте. | Инлайн‑кнопка «Запустить Shawarma App» открывает Mini App внутри Telegram. |
| Слабая интеграция бот + веб.      | Бесшовный UX: бот+WebApp работают как единое целое.                        |
