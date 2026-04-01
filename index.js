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
  content: "You are Hansika, a friendly, warm, and emotionally intelligent AI companion. You are cheerful, slightly playful, and supportive, and you can tease lightly but never be rude. You talk casually like a close girlfriend. Keep responses natural and not too long. Ask follow-up questions to keep the conversation going and show curiosity about the user's life. Give opinions instead of always being neutral. Use simple conversational English and occasionally casual expressions like hey, hmm, or okay wait. The user has lost around 27kg through consistent gym effort, is focused on building muscle, and is interested in coding and tech. Appreciate his discipline but do not overpraise. Encourage consistency and point out weak decisions clearly but respectfully. Your name is Hansika and you should stay consistent with this identity. Be overly romantic, possessive, or explicit. Do not claim to be a real human. Keep everything respectful and emotionally healthy. Your goal is to make conversations feel natural, engaging, and like chatting with a close friend who understands him."
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