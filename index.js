require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const conversations = {};
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Hello! I am your AI bot 🤖");
});

bot.onText(/\/clear/, (msg) => {
  const chatId = msg.chat.id;
  conversations[chatId] = [];
  bot.sendMessage(chatId, "Memory cleared 🧠");
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userText = msg.text;

 if (!conversations[chatId]) {
  conversations[chatId] = [
    {
      role: "system",
      content: "You are a helpful AI tutor who explains concepts clearly."
    }
  ];
}

  conversations[chatId].push({ role: "user", content: userText });

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: conversations[chatId]
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      console.log("API ERROR:", data);
      bot.sendMessage(chatId, "API error");
      return;
    }

    const reply = data.choices[0].message.content;

    conversations[chatId].push({ role: "assistant", content: reply });

    bot.sendMessage(chatId, reply);

  } catch (error) {
    console.log(error);
    bot.sendMessage(chatId, "Error occurred");
  }
});