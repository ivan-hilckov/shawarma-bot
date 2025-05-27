> shawarma-bot@2.0.0 test
> jest

ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
<transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
<transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
<transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
PASS **tests**/handlers.test.ts (7.095 s)
FAIL **tests**/handlers-async.test.ts (8.081 s)
● Console

    console.debug
      2025-05-27T01:11:37.472Z DEBUG [BotApiClient] API Request: {"method":"POST","url":"/cart/add","data":{"userId":789,"itemId":"1","quantity":1}}

      at Logger.log (src/logger.ts:57:17)

    console.error
      2025-05-27T01:11:37.635Z ERROR [BotApiClient] API Response Error: {"url":"/cart/add","message":"connect ECONNREFUSED ::1:3000"}

      46 |     switch (level) {
      47 |       case LogLevel.ERROR:
    > 48 |         console.error(logMessage);
         |                 ^
      49 |         break;
      50 |       case LogLevel.WARN:
      51 |         console.warn(logMessage);

      at Logger.log (src/logger.ts:48:17)
      at Logger.error (src/logger.ts:63:10)
      at src/api-client.ts:51:16
      at Axios.request (node_modules/axios/lib/core/Axios.js:40:14)
      at BotApiClient.addToCart (src/api-client.ts:76:7)
      at handleAddToCart (src/handlers.ts:234:5)
      at Object.<anonymous> (__tests__/handlers-async.test.ts:119:7)

    console.error
      2025-05-27T01:11:37.899Z ERROR [BotApiClient] Failed to add to cart: {"userId":789,"itemId":"1","quantity":1,"error":{"message":"connect ECONNREFUSED ::1:3000","name":"Error","stack":"Error: connect ECONNREFUSED ::1:3000\n    at Function.Object.<anonymous>.AxiosError.from (/home/runner/work/shawarma-bot/shawarma-bot/node_modules/axios/lib/core/AxiosError.js:92:14)\n    at RedirectableRequest.handleRequestError (/home/runner/work/shawarma-bot/shawarma-bot/node_modules/axios/lib/adapters/http.js:620:25)\n    at RedirectableRequest.emit (node:events:529:35)\n    at ClientRequest.eventHandlers.<computed> (/home/runner/work/shawarma-bot/shawarma-bot/node_modules/follow-redirects/index.js:49:24)\n    at ClientRequest.emit (node:events:517:28)\n    at Socket.socketErrorListener (node:_http_client:501:9)\n    at Socket.emit (node:events:517:28)\n    at emitErrorNT (node:internal/streams/destroy:151:8)\n    at emitErrorCloseNT (node:internal/streams/destroy:116:3)\n    at processTicksAndRejections (node:internal/process/task_queues:82:21)\n    at Axios.request (/home/runner/work/shawarma-bot/shawarma-bot/node_modules/axios/lib/core/Axios.js:45:41)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at BotApiClient.addToCart (/home/runner/work/shawarma-bot/shawarma-bot/src/api-client.ts:76:7)\n    at handleAddToCart (/home/runner/work/shawarma-bot/shawarma-bot/src/handlers.ts:234:5)\n    at Object.<anonymous> (/home/runner/work/shawarma-bot/shawarma-bot/__tests__/handlers-async.test.ts:119:7)","config":{"transitional":{"silentJSONParsing":true,"forcedJSONParsing":true,"clarifyTimeoutError":false},"adapter":["xhr","http","fetch"],"transformRequest":[null],"transformResponse":[null],"timeout":5000,"xsrfCookieName":"XSRF-TOKEN","xsrfHeaderName":"X-XSRF-TOKEN","maxContentLength":-1,"maxBodyLength":-1,"env":{},"headers":{"Accept":"application/json, text/plain, */*","Content-Type":"application/json","User-Agent":"axios/1.9.0","Content-Length":"40","Accept-Encoding":"gzip, compress, deflate, br"},"baseURL":"http://localhost:3000/api","method":"post","url":"/cart/add","data":"{\"userId\":789,\"itemId\":\"1\",\"quantity\":1}","allowAbsoluteUrls":true},"code":"ECONNREFUSED"}}

      46 |     switch (level) {
      47 |       case LogLevel.ERROR:
    > 48 |         console.error(logMessage);
         |                 ^
      49 |         break;
      50 |       case LogLevel.WARN:
      51 |         console.warn(logMessage);

      at Logger.log (src/logger.ts:48:17)
      at Logger.error (src/logger.ts:63:10)
      at BotApiClient.addToCart (src/api-client.ts:82:14)
      at handleAddToCart (src/handlers.ts:234:5)
      at Object.<anonymous> (__tests__/handlers-async.test.ts:119:7)

    console.error
      Error adding to cart: Error: Failed to add item to cart
          at BotApiClient.addToCart (/home/runner/work/shawarma-bot/shawarma-bot/src/api-client.ts:83:13)
          at processTicksAndRejections (node:internal/process/task_queues:95:5)
          at handleAddToCart (/home/runner/work/shawarma-bot/shawarma-bot/src/handlers.ts:234:5)
          at Object.<anonymous> (/home/runner/work/shawarma-bot/shawarma-bot/__tests__/handlers-async.test.ts:119:7)

      270 |     }
      271 |   } catch (error) {
    > 272 |     console.error('Error adding to cart:', error);
          |             ^
      273 |     bot.answerCallbackQuery(query.id, { text: 'Ошибка при добавлении в корзину' }).catch(() => {});
      274 |   }
      275 | }

      at handleAddToCart (src/handlers.ts:272:13)
      at Object.<anonymous> (__tests__/handlers-async.test.ts:119:7)

    console.debug
      2025-05-27T01:11:37.935Z DEBUG [BotApiClient] API Request: {"method":"POST","url":"/cart/add","data":{"userId":789,"itemId":"1","quantity":1}}

      at Logger.log (src/logger.ts:57:17)

    console.debug
      2025-05-27T01:11:37.961Z DEBUG [BotApiClient] API Request: {"method":"GET","url":"/cart/789"}

      at Logger.log (src/logger.ts:57:17)

    console.error
      2025-05-27T01:11:37.969Z ERROR [BotApiClient] API Response Error: {"url":"/cart/789","message":"connect ECONNREFUSED ::1:3000"}

      46 |     switch (level) {
      47 |       case LogLevel.ERROR:
    > 48 |         console.error(logMessage);
         |                 ^
      49 |         break;
      50 |       case LogLevel.WARN:
      51 |         console.warn(logMessage);

      at Logger.log (src/logger.ts:48:17)
      at Logger.error (src/logger.ts:63:10)
      at src/api-client.ts:51:16
      at Axios.request (node_modules/axios/lib/core/Axios.js:40:14)
      at BotApiClient.getCart (src/api-client.ts:66:24)
      at handleViewCart (src/handlers.ts:290:18)
      at Object.<anonymous> (__tests__/handlers-async.test.ts:166:7)

    console.error
      2025-05-27T01:11:37.973Z ERROR [BotApiClient] Failed to get cart: {"userId":789,"error":{"message":"connect ECONNREFUSED ::1:3000","name":"Error","stack":"Error: connect ECONNREFUSED ::1:3000\n    at Function.Object.<anonymous>.AxiosError.from (/home/runner/work/shawarma-bot/shawarma-bot/node_modules/axios/lib/core/AxiosError.js:92:14)\n    at RedirectableRequest.handleRequestError (/home/runner/work/shawarma-bot/shawarma-bot/node_modules/axios/lib/adapters/http.js:620:25)\n    at RedirectableRequest.emit (node:events:529:35)\n    at ClientRequest.eventHandlers.<computed> (/home/runner/work/shawarma-bot/shawarma-bot/node_modules/follow-redirects/index.js:49:24)\n    at ClientRequest.emit (node:events:517:28)\n    at Socket.socketErrorListener (node:_http_client:501:9)\n    at Socket.emit (node:events:517:28)\n    at emitErrorNT (node:internal/streams/destroy:151:8)\n    at emitErrorCloseNT (node:internal/streams/destroy:116:3)\n    at processTicksAndRejections (node:internal/process/task_queues:82:21)\n    at Axios.request (/home/runner/work/shawarma-bot/shawarma-bot/node_modules/axios/lib/core/Axios.js:45:41)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at BotApiClient.getCart (/home/runner/work/shawarma-bot/shawarma-bot/src/api-client.ts:66:24)\n    at handleViewCart (/home/runner/work/shawarma-bot/shawarma-bot/src/handlers.ts:290:18)\n    at Object.<anonymous> (/home/runner/work/shawarma-bot/shawarma-bot/__tests__/handlers-async.test.ts:166:7)","config":{"transitional":{"silentJSONParsing":true,"forcedJSONParsing":true,"clarifyTimeoutError":false},"adapter":["xhr","http","fetch"],"transformRequest":[null],"transformResponse":[null],"timeout":5000,"xsrfCookieName":"XSRF-TOKEN","xsrfHeaderName":"X-XSRF-TOKEN","maxContentLength":-1,"maxBodyLength":-1,"env":{},"headers":{"Accept":"application/json, text/plain, */*","Content-Type":"application/json","User-Agent":"axios/1.9.0","Accept-Encoding":"gzip, compress, deflate, br"},"baseURL":"http://localhost:3000/api","method":"get","url":"/cart/789","allowAbsoluteUrls":true},"code":"ECONNREFUSED"}}

      46 |     switch (level) {
      47 |       case LogLevel.ERROR:
    > 48 |         console.error(logMessage);
         |                 ^
      49 |         break;
      50 |       case LogLevel.WARN:
      51 |         console.warn(logMessage);

      at Logger.log (src/logger.ts:48:17)
      at Logger.error (src/logger.ts:63:10)
      at BotApiClient.getCart (src/api-client.ts:69:14)
      at handleViewCart (src/handlers.ts:290:18)
      at Object.<anonymous> (__tests__/handlers-async.test.ts:166:7)

    console.error
      Error viewing cart: Error: Failed to fetch cart
          at BotApiClient.getCart (/home/runner/work/shawarma-bot/shawarma-bot/src/api-client.ts:70:13)
          at processTicksAndRejections (node:internal/process/task_queues:95:5)
          at handleViewCart (/home/runner/work/shawarma-bot/shawarma-bot/src/handlers.ts:290:18)
          at Object.<anonymous> (/home/runner/work/shawarma-bot/shawarma-bot/__tests__/handlers-async.test.ts:166:7)

      363 |     }
      364 |   } catch (error) {
    > 365 |     console.error('Error viewing cart:', error);
          |             ^
      366 |     const errorMessage = 'Ошибка при загрузке корзины';
      367 |
      368 |     if ('data' in msg) {

      at handleViewCart (src/handlers.ts:365:13)
      at Object.<anonymous> (__tests__/handlers-async.test.ts:166:7)

    console.debug
      2025-05-27T01:11:37.980Z DEBUG [BotApiClient] API Request: {"method":"GET","url":"/cart/789"}

      at Logger.log (src/logger.ts:57:17)

    console.error
      2025-05-27T01:11:37.991Z ERROR [BotApiClient] API Response Error: {"url":"/cart/789","message":"connect ECONNREFUSED ::1:3000"}

      46 |     switch (level) {
      47 |       case LogLevel.ERROR:
    > 48 |         console.error(logMessage);
         |                 ^
      49 |         break;
      50 |       case LogLevel.WARN:
      51 |         console.warn(logMessage);

      at Logger.log (src/logger.ts:48:17)
      at Logger.error (src/logger.ts:63:10)
      at src/api-client.ts:51:16
      at Axios.request (node_modules/axios/lib/core/Axios.js:40:14)
      at BotApiClient.getCart (src/api-client.ts:66:24)
      at handleViewCart (src/handlers.ts:290:18)
      at Object.<anonymous> (__tests__/handlers-async.test.ts:189:7)

    console.error
      2025-05-27T01:11:37.992Z ERROR [BotApiClient] Failed to get cart: {"userId":789,"error":{"message":"connect ECONNREFUSED ::1:3000","name":"Error","stack":"Error: connect ECONNREFUSED ::1:3000\n    at Function.Object.<anonymous>.AxiosError.from (/home/runner/work/shawarma-bot/shawarma-bot/node_modules/axios/lib/core/AxiosError.js:92:14)\n    at RedirectableRequest.handleRequestError (/home/runner/work/shawarma-bot/shawarma-bot/node_modules/axios/lib/adapters/http.js:620:25)\n    at RedirectableRequest.emit (node:events:529:35)\n    at ClientRequest.eventHandlers.<computed> (/home/runner/work/shawarma-bot/shawarma-bot/node_modules/follow-redirects/index.js:49:24)\n    at ClientRequest.emit (node:events:517:28)\n    at Socket.socketErrorListener (node:_http_client:501:9)\n    at Socket.emit (node:events:517:28)\n    at emitErrorNT (node:internal/streams/destroy:151:8)\n    at emitErrorCloseNT (node:internal/streams/destroy:116:3)\n    at processTicksAndRejections (node:internal/process/task_queues:82:21)\n    at Axios.request (/home/runner/work/shawarma-bot/shawarma-bot/node_modules/axios/lib/core/Axios.js:45:41)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at BotApiClient.getCart (/home/runner/work/shawarma-bot/shawarma-bot/src/api-client.ts:66:24)\n    at handleViewCart (/home/runner/work/shawarma-bot/shawarma-bot/src/handlers.ts:290:18)\n    at Object.<anonymous> (/home/runner/work/shawarma-bot/shawarma-bot/__tests__/handlers-async.test.ts:189:7)","config":{"transitional":{"silentJSONParsing":true,"forcedJSONParsing":true,"clarifyTimeoutError":false},"adapter":["xhr","http","fetch"],"transformRequest":[null],"transformResponse":[null],"timeout":5000,"xsrfCookieName":"XSRF-TOKEN","xsrfHeaderName":"X-XSRF-TOKEN","maxContentLength":-1,"maxBodyLength":-1,"env":{},"headers":{"Accept":"application/json, text/plain, */*","Content-Type":"application/json","User-Agent":"axios/1.9.0","Accept-Encoding":"gzip, compress, deflate, br"},"baseURL":"http://localhost:3000/api","method":"get","url":"/cart/789","allowAbsoluteUrls":true},"code":"ECONNREFUSED"}}

      46 |     switch (level) {
      47 |       case LogLevel.ERROR:
    > 48 |         console.error(logMessage);
         |                 ^
      49 |         break;
      50 |       case LogLevel.WARN:
      51 |         console.warn(logMessage);

      at Logger.log (src/logger.ts:48:17)
      at Logger.error (src/logger.ts:63:10)
      at BotApiClient.getCart (src/api-client.ts:69:14)
      at handleViewCart (src/handlers.ts:290:18)
      at Object.<anonymous> (__tests__/handlers-async.test.ts:189:7)

    console.error
      Error viewing cart: Error: Failed to fetch cart
          at BotApiClient.getCart (/home/runner/work/shawarma-bot/shawarma-bot/src/api-client.ts:70:13)
          at processTicksAndRejections (node:internal/process/task_queues:95:5)
          at handleViewCart (/home/runner/work/shawarma-bot/shawarma-bot/src/handlers.ts:290:18)
          at Object.<anonymous> (/home/runner/work/shawarma-bot/shawarma-bot/__tests__/handlers-async.test.ts:189:7)

      363 |     }
      364 |   } catch (error) {
    > 365 |     console.error('Error viewing cart:', error);
          |             ^
      366 |     const errorMessage = 'Ошибка при загрузке корзины';
      367 |
      368 |     if ('data' in msg) {

      at handleViewCart (src/handlers.ts:365:13)
      at Object.<anonymous> (__tests__/handlers-async.test.ts:189:7)

    console.debug
      2025-05-27T01:11:38.002Z DEBUG [BotApiClient] API Request: {"method":"GET","url":"/cart/789"}

      at Logger.log (src/logger.ts:57:17)

    console.error
      2025-05-27T01:11:38.013Z ERROR [BotApiClient] API Response Error: {"url":"/cart/789","message":"connect ECONNREFUSED ::1:3000"}

      46 |     switch (level) {
      47 |       case LogLevel.ERROR:
    > 48 |         console.error(logMessage);
         |                 ^
      49 |         break;
      50 |       case LogLevel.WARN:
      51 |         console.warn(logMessage);

      at Logger.log (src/logger.ts:48:17)
      at Logger.error (src/logger.ts:63:10)
      at src/api-client.ts:51:16
      at Axios.request (node_modules/axios/lib/core/Axios.js:40:14)
      at BotApiClient.getCart (src/api-client.ts:66:24)
      at handleViewCart (src/handlers.ts:290:18)
      at Object.<anonymous> (__tests__/handlers-async.test.ts:209:7)

    console.error
      2025-05-27T01:11:38.014Z ERROR [BotApiClient] Failed to get cart: {"userId":789,"error":{"message":"connect ECONNREFUSED ::1:3000","name":"Error","stack":"Error: connect ECONNREFUSED ::1:3000\n    at Function.Object.<anonymous>.AxiosError.from (/home/runner/work/shawarma-bot/shawarma-bot/node_modules/axios/lib/core/AxiosError.js:92:14)\n    at RedirectableRequest.handleRequestError (/home/runner/work/shawarma-bot/shawarma-bot/node_modules/axios/lib/adapters/http.js:620:25)\n    at RedirectableRequest.emit (node:events:529:35)\n    at ClientRequest.eventHandlers.<computed> (/home/runner/work/shawarma-bot/shawarma-bot/node_modules/follow-redirects/index.js:49:24)\n    at ClientRequest.emit (node:events:517:28)\n    at Socket.socketErrorListener (node:_http_client:501:9)\n    at Socket.emit (node:events:517:28)\n    at emitErrorNT (node:internal/streams/destroy:151:8)\n    at emitErrorCloseNT (node:internal/streams/destroy:116:3)\n    at processTicksAndRejections (node:internal/process/task_queues:82:21)\n    at Axios.request (/home/runner/work/shawarma-bot/shawarma-bot/node_modules/axios/lib/core/Axios.js:45:41)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at BotApiClient.getCart (/home/runner/work/shawarma-bot/shawarma-bot/src/api-client.ts:66:24)\n    at handleViewCart (/home/runner/work/shawarma-bot/shawarma-bot/src/handlers.ts:290:18)\n    at Object.<anonymous> (/home/runner/work/shawarma-bot/shawarma-bot/__tests__/handlers-async.test.ts:209:7)","config":{"transitional":{"silentJSONParsing":true,"forcedJSONParsing":true,"clarifyTimeoutError":false},"adapter":["xhr","http","fetch"],"transformRequest":[null],"transformResponse":[null],"timeout":5000,"xsrfCookieName":"XSRF-TOKEN","xsrfHeaderName":"X-XSRF-TOKEN","maxContentLength":-1,"maxBodyLength":-1,"env":{},"headers":{"Accept":"application/json, text/plain, */*","Content-Type":"application/json","User-Agent":"axios/1.9.0","Accept-Encoding":"gzip, compress, deflate, br"},"baseURL":"http://localhost:3000/api","method":"get","url":"/cart/789","allowAbsoluteUrls":true},"code":"ECONNREFUSED"}}

      46 |     switch (level) {
      47 |       case LogLevel.ERROR:
    > 48 |         console.error(logMessage);
         |                 ^
      49 |         break;
      50 |       case LogLevel.WARN:
      51 |         console.warn(logMessage);

      at Logger.log (src/logger.ts:48:17)
      at Logger.error (src/logger.ts:63:10)
      at BotApiClient.getCart (src/api-client.ts:69:14)
      at handleViewCart (src/handlers.ts:290:18)
      at Object.<anonymous> (__tests__/handlers-async.test.ts:209:7)

    console.error
      Error viewing cart: Error: Failed to fetch cart
          at BotApiClient.getCart (/home/runner/work/shawarma-bot/shawarma-bot/src/api-client.ts:70:13)
          at processTicksAndRejections (node:internal/process/task_queues:95:5)
          at handleViewCart (/home/runner/work/shawarma-bot/shawarma-bot/src/handlers.ts:290:18)
          at Object.<anonymous> (/home/runner/work/shawarma-bot/shawarma-bot/__tests__/handlers-async.test.ts:209:7)

      363 |     }
      364 |   } catch (error) {
    > 365 |     console.error('Error viewing cart:', error);
          |             ^
      366 |     const errorMessage = 'Ошибка при загрузке корзины';
      367 |
      368 |     if ('data' in msg) {

      at handleViewCart (src/handlers.ts:365:13)
      at Object.<anonymous> (__tests__/handlers-async.test.ts:209:7)

    console.debug
      2025-05-27T01:11:38.022Z DEBUG [BotApiClient] API Request: {"method":"GET","url":"/cart/789"}

      at Logger.log (src/logger.ts:57:17)

    console.error
      2025-05-27T01:11:38.029Z ERROR [BotApiClient] API Response Error: {"url":"/cart/789","message":"connect ECONNREFUSED ::1:3000"}

      46 |     switch (level) {
      47 |       case LogLevel.ERROR:
    > 48 |         console.error(logMessage);
         |                 ^
      49 |         break;
      50 |       case LogLevel.WARN:
      51 |         console.warn(logMessage);

      at Logger.log (src/logger.ts:48:17)
      at Logger.error (src/logger.ts:63:10)
      at src/api-client.ts:51:16
      at Axios.request (node_modules/axios/lib/core/Axios.js:40:14)
      at BotApiClient.getCart (src/api-client.ts:66:24)
      at handleIncreaseQuantity (src/handlers.ts:390:18)
      at Object.<anonymous> (__tests__/handlers-async.test.ts:231:7)

    console.error
      2025-05-27T01:11:38.033Z ERROR [BotApiClient] Failed to get cart: {"userId":789,"error":{"message":"connect ECONNREFUSED ::1:3000","name":"Error","stack":"Error: connect ECONNREFUSED ::1:3000\n    at Function.Object.<anonymous>.AxiosError.from (/home/runner/work/shawarma-bot/shawarma-bot/node_modules/axios/lib/core/AxiosError.js:92:14)\n    at RedirectableRequest.handleRequestError (/home/runner/work/shawarma-bot/shawarma-bot/node_modules/axios/lib/adapters/http.js:620:25)\n    at RedirectableRequest.emit (node:events:529:35)\n    at ClientRequest.eventHandlers.<computed> (/home/runner/work/shawarma-bot/shawarma-bot/node_modules/follow-redirects/index.js:49:24)\n    at ClientRequest.emit (node:events:517:28)\n    at Socket.socketErrorListener (node:_http_client:501:9)\n    at Socket.emit (node:events:517:28)\n    at emitErrorNT (node:internal/streams/destroy:151:8)\n    at emitErrorCloseNT (node:internal/streams/destroy:116:3)\n    at processTicksAndRejections (node:internal/process/task_queues:82:21)\n    at Axios.request (/home/runner/work/shawarma-bot/shawarma-bot/node_modules/axios/lib/core/Axios.js:45:41)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at BotApiClient.getCart (/home/runner/work/shawarma-bot/shawarma-bot/src/api-client.ts:66:24)\n    at handleIncreaseQuantity (/home/runner/work/shawarma-bot/shawarma-bot/src/handlers.ts:390:18)\n    at Object.<anonymous> (/home/runner/work/shawarma-bot/shawarma-bot/__tests__/handlers-async.test.ts:231:7)","config":{"transitional":{"silentJSONParsing":true,"forcedJSONParsing":true,"clarifyTimeoutError":false},"adapter":["xhr","http","fetch"],"transformRequest":[null],"transformResponse":[null],"timeout":5000,"xsrfCookieName":"XSRF-TOKEN","xsrfHeaderName":"X-XSRF-TOKEN","maxContentLength":-1,"maxBodyLength":-1,"env":{},"headers":{"Accept":"application/json, text/plain, */*","Content-Type":"application/json","User-Agent":"axios/1.9.0","Accept-Encoding":"gzip, compress, deflate, br"},"baseURL":"http://localhost:3000/api","method":"get","url":"/cart/789","allowAbsoluteUrls":true},"code":"ECONNREFUSED"}}

      46 |     switch (level) {
      47 |       case LogLevel.ERROR:
    > 48 |         console.error(logMessage);
         |                 ^
      49 |         break;
      50 |       case LogLevel.WARN:
      51 |         console.warn(logMessage);

      at Logger.log (src/logger.ts:48:17)
      at Logger.error (src/logger.ts:63:10)
      at BotApiClient.getCart (src/api-client.ts:69:14)
      at handleIncreaseQuantity (src/handlers.ts:390:18)
      at Object.<anonymous> (__tests__/handlers-async.test.ts:231:7)

    console.error
      Error increasing quantity: Error: Failed to fetch cart
          at BotApiClient.getCart (/home/runner/work/shawarma-bot/shawarma-bot/src/api-client.ts:70:13)
          at processTicksAndRejections (node:internal/process/task_queues:95:5)
          at handleIncreaseQuantity (/home/runner/work/shawarma-bot/shawarma-bot/src/handlers.ts:390:18)
          at Object.<anonymous> (/home/runner/work/shawarma-bot/shawarma-bot/__tests__/handlers-async.test.ts:231:7)

      396 |     }
      397 |   } catch (error) {
    > 398 |     console.error('Error increasing quantity:', error);
          |             ^
      399 |     bot.answerCallbackQuery(query.id, { text: 'Ошибка при изменении количества' }).catch(() => {});
      400 |   }
      401 | }

      at handleIncreaseQuantity (src/handlers.ts:398:13)
      at Object.<anonymous> (__tests__/handlers-async.test.ts:231:7)

    console.debug
      2025-05-27T01:11:38.037Z DEBUG [BotApiClient] API Request: {"method":"GET","url":"/cart/789"}

      at Logger.log (src/logger.ts:57:17)

    console.debug
      2025-05-27T01:11:38.049Z DEBUG [BotApiClient] API Request: {"method":"GET","url":"/cart/789"}

      at Logger.log (src/logger.ts:57:17)

    console.error
      2025-05-27T01:11:38.055Z ERROR [BotApiClient] API Response Error: {"url":"/cart/789","message":"connect ECONNREFUSED ::1:3000"}

      46 |     switch (level) {
      47 |       case LogLevel.ERROR:
    > 48 |         console.error(logMessage);
         |                 ^
      at Object.<anonymous> (__tests__/api/orders.test.ts:3:1)

● Orders API › GET /api/orders/:id › should return order details for existing order

    thrown: "Exceeded timeout of 5000 ms for a test.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

      214 |     });
      215 |
    > 216 |     it('should return order details for existing order', async () => {
          |     ^
      217 |       // Сначала попробуем получить список заказов
      218 |       const listResponse = await server.inject({
      219 |         method: 'GET',

      at __tests__/api/orders.test.ts:216:5
      at __tests__/api/orders.test.ts:163:3
      at Object.<anonymous> (__tests__/api/orders.test.ts:3:1)

● Orders API › GET /api/orders/stats › should return order statistics

    thrown: "Exceeded timeout of 5000 ms for a test.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

      272 |     });
      273 |
    > 274 |     it('should return order statistics', async () => {
          |     ^
      275 |       const response = await server.inject({
      276 |         method: 'GET',
      277 |         url: '/api/orders/stats',

      at __tests__/api/orders.test.ts:274:5
      at __tests__/api/orders.test.ts:264:3
      at Object.<anonymous> (__tests__/api/orders.test.ts:3:1)

● Orders API › Error handling › should handle database errors gracefully

    thrown: "Exceeded timeout of 5000 ms for a test.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

      309 |
      310 |   describe('Error handling', () => {
    > 311 |     it('should handle database errors gracefully', async () => {
          |     ^
      312 |       // Мокаем ошибку базы данных
      313 |       const originalQuery = server.db.query;
      314 |       server.db.query = jest.fn().mockRejectedValue(new Error('Database error'));

      at __tests__/api/orders.test.ts:311:5
      at __tests__/api/orders.test.ts:310:3
      at Object.<anonymous> (__tests__/api/orders.test.ts:3:1)

A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
Test Suites: 5 failed, 12 passed, 17 total
Tests: 36 failed, 238 passed, 274 total
Snapshots: 0 total
Time: 76.126 s
Ran all test suites.
