require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start((ctx) => ctx.reply('Welcome'));
bot.help((ctx) => ctx.reply('Send me a sticker'));
bot.hears('hi', (ctx) => ctx.reply('Hey hihi' + ` ${JSON.stringify(Object.keys(ctx.state))}`));
// bot.hears('hi', (ctx) => ctx.reply('Hey there'));
bot.on('channel_post', (ctx) => ctx.reply('Hey channel_post:' + `Hello ${JSON.stringify(Object.keys(ctx.telegram))}`))

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));