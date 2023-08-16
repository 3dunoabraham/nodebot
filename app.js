const { createClient } = require('@supabase/supabase-js');
const express = require('express')
const createError = require('http-errors')
const morgan = require('morgan')
require('dotenv').config()
const { Telegraf } = require('telegraf');

const hardcode = {
  "c841339a5bafe0b116abc6dc4746557dc3cc9ebadc6f2d68423c1efd3cc34da7" : 3
}

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start((ctx) => ctx.reply('Welcome'));
bot.help((ctx) => ctx.reply('Send me a sticker'));
bot.on('inline_query', async (ctx) => {
  const queryText = ctx.update.inline_query.query;

  const randdd = parseInt(Math.random() * 100)
  const results = await generateInlineResults(queryText,randdd);

  await ctx.answerInlineQuery(results);
});

async function generateInlineResults(queryText,randdd) {
  const results = [];
  const textResult = {
    type: 'article',
    id: '1',
    title: 'Text Result #'+randdd,
    input_message_content: {
      message_text: `You entered: ${queryText} \nYou got: ${randdd}`,
    },
  };
  
  // const foundHardcode = hardcode[queryText]
  let thePllayer = null;
  try {
    thePllayer = await fetchPlayer(queryText)
  } catch (error) {
    thePllayer = {name:`player not found`,subscription:0}
    
  }
  const betterResult = !thePllayer.subscription ? textResult : {
    type: 'article',
    id: '1',
    title: '->Text Result +++'+thePllayer.name,
    input_message_content: {
      message_text: `ey: ${thePllayer.name} ye You entered: |${queryText}| \n${queryText.length}You got: ${randdd}`,
    },
  };
  results.push(betterResult);

  return results;
}
bot.launch();
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fetchPlayer(playerHash) {
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const { data: existingStart, error: selectError } = await supabase
    .from('player')
    // .select()
    .select('name, attempts, totalAttempts, goodAttempts, trades, mode, jwt, binancekeys, subscription, referral')
    .match({ hash: playerHash })
    .single();
  return existingStart;
}

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
