import { Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import config from "config";
import { ogg } from "./ogg.js";
import { openai } from "./openai.js";

console.log(config.get("TEST_ENV"));

const INITIAL_SESSION = {
  messages: [],
};

const bot = new Telegraf(config.get("TELEGRAM_TOKEN"));

bot.use(session());

const initSession = function (ctx) {
  ctx.session = { ...INITIAL_SESSION };
  ctx.session.messages = null;
  ctx.session.messages = [];
};

bot.command("start", async (ctx) => {
  initSession(ctx);
  await ctx.reply("Привет! Зови меня Луна.");
  await ctx.reply("Я твой ИИ-друг, готовый помочь в любой ситуации.");
  await ctx.reply("Чем займемся?");
});

bot.command("new", async function (ctx) {
  initSession(ctx);
  await ctx.reply("Жду вашего голосового или текстового сообщения");
});

bot.on(message("text"), async (ctx) => {
  if (!Array.isArray(ctx?.session?.messages)) {
    initSession(ctx);
  }

  ctx.session.messages.push({
    role: openai.roles.USER,
    content: ctx.message.text,
  });

  const response = await openai.chat(ctx.session.messages);

  ctx.session.messages.push({
    role: openai.roles.ASSISTANT,
    content: response,
  });

  await ctx.reply(response);
});

bot.on(message("voice"), async (ctx) => {
  if (!Array.isArray(ctx?.session?.messages)) {
    initSession(ctx);
  }

  try {
    await ctx.reply(code("Сообщение принял. Жду ответа от сервера..."));

    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const userId = String(ctx.message.from.id);
    const oggPath = await ogg.create(link.href, userId);
    const mp3Path = await ogg.toMp3(oggPath, userId);

    const text = await openai.transcription(mp3Path);
    await ctx.reply(code(`Ваш запрос: ${text}`));

    ctx.session.messages.push({ role: openai.roles.USER, content: text });
    const response = await openai.chat(ctx.session.messages);
    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response,
    });

    await ctx.reply(response);
  } catch (e) {
    ctx.reply("Ошибка Ж(");
    ctx.reply(e.message);
  }
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
