// Подключаем библиотеку для работы с телеграм-ботом
const TelegramBot = require('node-telegram-bot-api');

// Задаем токен для бота, который получили от BotFather
const token = '';

// Создаем экземпляр бота
const bot = new TelegramBot(token, {polling: true});

// Задаем код для доступа к админ-панели
const adminCode = '1234';

// Создаем объект для хранения данных о пользователях
const users = {};

// Создаем объект для хранения данных об опросах
const polls = {};

// Создаем массив с вопросами для опроса
const questions = [
  'Сколько вы любите меня?',
  'Сколько сейчас время?',
  'Сколько вы выйдите лог?'
];

// Создаем функцию для отправки сообщения с кнопками
function sendButtons(chatId, text, buttons) {
  // Определяем опции для клавиатуры
  const options = {
    reply_markup: {
      keyboard: buttons,
      one_time_keyboard: true,
      resize_keyboard: true
    }
  };
  // Отправляем сообщение с текстом и кнопками
  bot.sendMessage(chatId, text, options);
}

// Обрабатываем команду /start
bot.onText(/\/start/, (msg) => {
  // Получаем идентификатор чата
  const chatId = msg.chat.id;
  // Проверяем, есть ли пользователь в нашем объекте
  if (!users[chatId]) {
    // Если нет, то создаем нового пользователя с пустыми данными
    users[chatId] = {
      name: '',
      surname: '',
      answers: []
    };
    // Отправляем приветственное сообщение и просим ввести имя
    bot.sendMessage(chatId, 'Привет, это бот для опроса. Как тебя зовут?');
  } else {
    // Если есть, то отправляем сообщение с кнопками для регистрации или входа в админ-панель
    sendButtons(chatId, 'Выбери действие:', [['Регистрация пользователя'], ['Вход в админ-панель']]);
  }
});

// Обрабатываем текстовые сообщения
bot.on('message', (msg) => {
  // Получаем идентификатор чата и текст сообщения
  const chatId = msg.chat.id;
  const text = msg.text;
  // Проверяем, есть ли пользователь в нашем объекте
  if (users[chatId]) {
    // Если есть, то проверяем, какое действие он выбрал
    if (text === 'Регистрация пользователя') {
      // Если выбрал регистрацию, то просим ввести имя
      bot.sendMessage(chatId, 'Как тебя зовут?');
    } else if (text === 'Вход в админ-панель') {
      // Если выбрал вход в админ-панель, то просим ввести код
      bot.sendMessage(chatId, 'Введите код:');
    } else if (text === adminCode) {
      // Если ввел правильный код, то пускаем в админ-панель и показываем список опросов
      bot.sendMessage(chatId, 'Добро пожаловать в админ-панель. Вот список опросов:');
      // Перебираем все опросы в нашем объекте
      for (let pollId in polls) {
        // Получаем данные об опросе по идентификатору
        let poll = polls[pollId];
        // Формируем текст с информацией об опросе и его статусе
        let text = `Опрос №${pollId}\nИмя: ${poll.name}\nФамилия: ${poll.surname}\nОтветы: ${poll.answers.join(', ')}\nСтатус: ${poll.status}`;
        // Отправляем текст с кнопками для утверждения или отклонения опроса
        sendButtons(chatId, text, [['Да'], ['Нет']]);
      }
    } else if (text === 'Да' || text === 'Нет') {
      // Если ввел ответ на опрос, то меняем статус опроса и отправляем сообщение об этом
      // Получаем идентификатор последнего опроса, который мы показали пользователю
      let pollId = Object.keys(polls).pop();
      // Меняем статус опроса на введенный ответ
      polls[pollId].status = text;
      // Отправляем сообщение с подтверждением
      bot.sendMessage(chatId, `Вы изменили статус опроса №${pollId} на ${text}.`);
    } else {
      // Если ввел что-то другое, то проверяем, на каком этапе регистрации он находится
      if (users[chatId].name === '') {
        // Если не ввел имя, то сохраняем его и просим ввести фамилию
        users[chatId].name = text;
        bot.sendMessage(chatId, 'Какая у тебя фамилия?');
      } else if (users[chatId].surname === '') {
        // Если не ввел фамилию, то сохраняем ее и просим пройти опрос
        users[chatId].surname = text;
        bot.sendMessage(chatId, 'Спасибо за регистрацию. Теперь пройди опрос.');
        // Отправляем первый вопрос из массива
        bot.sendMessage(chatId, questions[0]);
      } else {
        // Если ввел ответ на вопрос, то сохраняем его и проверяем, есть ли еще вопросы
        users[chatId].answers.push(text);
        if (users[chatId].answers.length < questions.length) {
          // Если есть, то отправляем следующий вопрос
          bot.sendMessage(chatId, questions[users[chatId].answers.length]);
        } else {
          // Если нет, то отправляем отчет об опросе
          bot.sendMessage(chatId, 'Спасибо за прохождение опроса. Вот твой отчет:');
          // Формируем текст с данными пользователя и его ответами
          let text = `Отчет об опросе\nИмя: ${users[chatId].name}\nФамилия: ${users[chatId].surname}\nОтветы: ${users[chatId].answers.join(', ')}`;
          // Отправляем текст
          bot.sendMessage(chatId, text);
          // Создаем новый опрос в нашем объекте с данными пользователя и пустым статусом
          polls[Object.keys(polls).length + 1] = {
            name: users[chatId].name,
            surname: users[chatId].surname,
            answers: users[chatId].answers,
            status: ''
          };
          // Очищаем данные пользователя для новой регистрации
          users[chatId] = {
            name: '',
            surname: '',
            answers: []
          };
          // Отправляем сообщение с кнопками для регистрации или входа в админ-панель
          sendButtons(chatId, 'Выбери действие:', [['Регистрация пользователя'], ['Вход в админ-панель']]);
        }
      }
    }
  }
});
