// Подключаем библиотеку для работы с телеграм-ботом
const TelegramBot = require('node-telegram-bot-api');

// Создаем экземпляр бота с токеном, который вы получили от BotFather
const bot = new TelegramBot('', {polling: true});

// Создаем массив с вопросами для опросника
const questions = [
  'Вы курите?',
  'Вы любите меня?',
  'Дайте деньги мне',
  'Вы точно бот?',
];

// Создаем объект для хранения ответов пользователей
const answers = {};

// Обрабатываем команду /start, которая запускает опросник
bot.onText(/\/start/, (msg) => {
  // Получаем идентификатор чата и пользователя
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Создаем объект для хранения текущего вопроса и индекса
  const user = {
    question: 0,
    index: 0,
  };

  // Сохраняем объект пользователя в объекте ответов по идентификатору пользователя
  answers[userId] = user;

  // Отправляем первый вопрос пользователю с кнопками Да и Нет
  bot.sendMessage(chatId, questions[0], {
    reply_markup: {
      keyboard: [['Да', 'Нет']],
      one_time_keyboard: true,
      resize_keyboard: true,
    },
  });
});

// Обрабатываем любое сообщение от пользователя
bot.on('message', (msg) => {
  // Получаем идентификатор чата и пользователя
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Проверяем, есть ли пользователь в объекте ответов
  if (answers[userId]) {
    // Получаем объект пользователя из объекта ответов
    const user = answers[userId];

    // Проверяем, не закончился ли опросник
    if (user.question < questions.length) {
      // Сохраняем ответ пользователя в объекте пользователя по индексу вопроса
      user[user.index] = msg.text;

      // Увеличиваем индекс вопроса на единицу
      user.question++;

      // Увеличиваем индекс ответа на единицу
      user.index++;

      // Проверяем, не закончился ли опросник после увеличения индекса
      if (user.question < questions.length) {
        // Отправляем следующий вопрос пользователю с кнопками Да и Нет
        bot.sendMessage(chatId, questions[user.question], {
          reply_markup: {
            keyboard: [['Да', 'Нет']],
            one_time_keyboard: true,
            resize_keyboard: true,
          },
        });
      } else {
        // Опросник закончился, удаляем объект пользователя из объекта ответов
        delete answers[userId];

        // Формируем текст с результатами опросника
        let text = 'Вы успешно прошли анонимный опросник.\nВаши ответы:\n';
        for (let i = 0; i < questions.length; i++) {
          text += `${questions[i]} ${user[i]}\n`;
        }

        // Отправляем текст с результатами пользователю без кнопок
        bot.sendMessage(chatId, text, {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      }
    }
  }
});
