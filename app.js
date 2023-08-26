require('dotenv').config()
const cron = require("node-cron");
const express = require('express')
const morgan = require('morgan')
const { getSupabaseClient } = require('./script/state/repository/webdk');
const { Telegraf } = require('telegraf');
const createError = require('http-errors')

const { generalQubUpdateMessage, generalQubTradeMessage } = require('./script/state/service/webgram');
const { getFinalTelegramCheckMessage } = require('./script/state/service/webgram');


const supabase = getSupabaseClient();
const bot = new Telegraf(process.env.BOT_TOKEN);

/* Telegram Bot & Group *****************************************************************************************************/
function create_cron_datetime(seconds, minute, hour, day_of_the_month, month, day_of_the_week) {
  return `${seconds} ${minute} ${hour} ${day_of_the_month} ${month} ${day_of_the_week}`
}
console.log(`we have begun; ${create_cron_datetime(0, 0, 0, 2, 0, 0)}`);

cron.schedule(
  create_cron_datetime("*/33", '*', '*', '*', '*', '*'), // 33 seconds
  async function() {
    console.log(`...`)

    let finalMsg = await generalQubUpdateMessage(supabase, "")
    

  }
);  


/* Telegram Bot & Group *****************************************************************************************************/

bot.start((ctx) => ctx.reply('Welcome'));
bot.help((ctx) => ctx.reply('Send me a sticker'));
bot.command('web', async (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length !== 3) { return ctx.reply('Usage: /web <sub-app>') }

  const command = args[1]; // Extract the sub-app command after "/web"
  let theTradeString = ""
  console.log("command", command)
  if (command === 'pov') {
    const queryText = args[2]; // Extract the user href
    let finalMsg = await getFinalTelegramCheckMessage(supabase, queryText)
    ctx.reply(finalMsg)
  } else if (command === 'qub') {
    const queryText = args[2]; // Extract nothing
    let finalMsg = ""
    finalMsg = await generalQubUpdateMessage(supabase, queryText)
    ctx.reply(`|${finalMsg}|`)
  } else if (command === 'trade') {
    const queryText = args[2]; // Extract the user hash after "pov"
    if (queryText.length != 64) { return ctx.reply(`Invalid hash:\n${queryText}`) }
    let finalMsg = ""
    finalMsg = await generalQubTradeMessage(supabase, queryText)
    ctx.reply(`|${finalMsg}|`)
  } else {
    ctx.reply('Invalid sub-app.\nAvailable sub-apps: pov, qub, city, town');
  }
});


bot.launch();
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));


/* API Endpoints *****************************************************************************************************/
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(morgan('dev'))

app.get('/', async (req, res, next) => {
  res.send({ message: 'Awesome it works 🐻', my_env_var: process.env.MY_VAR })
})

app.use('/api', require('./routes/api.route'))

app.use((req, res, next) => {
  next(createError.NotFound())
})

app.use((err, req, res, next) => {
  res.status(err.status || 500)
  res.send({
    status: err.status || 500,
    message: err.message,
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`))

// bot.on('inline_query', async (ctx) => {
//   const queryText = ctx.update.inline_query.query;

//   const results = await generateInlineResults(queryText);
//   await ctx.answerInlineQuery(results);
// });