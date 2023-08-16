const express = require('express')
const createError = require('http-errors')
const morgan = require('morgan')
require('dotenv').config()
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start((ctx) => ctx.reply('Welcome'));
bot.help((ctx) => ctx.reply('Send me a sticker'));
bot.on('inline_query', async (ctx) => {
  const queryText = ctx.update.inline_query.query;

  const randdd = parseInt(Math.random() * 100)
  const results = generateInlineResults(queryText,randdd);

  await ctx.answerInlineQuery(results);
});

function generateInlineResults(queryText,randdd) {
  const results = [];
  const textResult = {
    type: 'article',
    id: '1',
    title: 'Text Result #'+randdd,
    input_message_content: {
      message_text: `You entered: ${queryText} \nYou got: ${randdd}`,
    },
  };

  results.push(textResult);

  return results;
}
bot.launch();
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

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
