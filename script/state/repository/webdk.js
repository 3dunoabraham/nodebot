const { createClient } = require('@supabase/supabase-js');
var https = require('https');
var crypto = require('crypto');
var {
  PS,
  qtyLookupTable,
  priceLookupTable,
  generalLookupTable,
  getCryptoPriceDecimals,
} = require('../../util/webhelp')


const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  return supabase
}

/* EXCHANGE */
/************************************************************************************************************/
function makeLimitOrder(
  { side, symbol, quantity, price, recvWindow = 5000, timestamp = Date.now() }, apiKey, apiSecret, callback) {
  const options = {
    hostname: 'api.binance.com',
    port: 443,
    path: '/api/v3/order',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-MBX-APIKEY': apiKey
    }
  };
  let _price = !!price ? price.toFixed(getCryptoPriceDecimals(symbol)) : 0
  if (!_price) {
    return null
  }
  const params = (`symbol=${symbol}&side=${side}&type=LIMIT&timeInForce=GTC&quantity=${quantity}`+
    `&price=${_price}&recvWindow=${recvWindow}&timestamp=${timestamp}`
  )
  const signature = crypto.createHmac('sha256', apiSecret).update(params).digest('hex');
  const data = `${params}&signature=${signature}`;
  const req = https.request(options, (res) => {
    let result = '';
    res.on('data', (data) => {
      result += data;
    });
    res.on('end', () => {
      callback(JSON.parse(result));
    });
  });
  req.on('error', (err) => {
    callback(err);
  });
  req.write(data);
  req.end();
}

const getCurrentPrice = async (requestToken) => {
  let theToken = requestToken || "BTCUSDT";

  let url = `https://api.binance.com/api/v3/ticker/price?symbol=${theToken}`;

  try {
    const response = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve(data);
        });
      }).on('error', (error) => {
        reject(error);
      });
    });

    const data = JSON.parse(response);
    const currentPrice = parseFloat(data.price);
    return currentPrice;
  } catch (error) {
    console.log("REQUEST FAILED", error);
    // You might want to handle the error here or return a default value
    return null;
  }
};


/* SUPABASE */
/************************************************************************************************************/
async function fetchPlayerByHref(supabase, href_input) {
  const { data: existingStart } = await supabase.from('player').select(PS.guest)
    .match({ href: href_input }).single();
  return existingStart;
}

async function fetchPlayerByHash(supabase, hash_input) {
  const { data: existingStart } = await supabase.from('player').select(PS.player)
    .match({ hash: hash_input }).single();
  return existingStart;
}

async function fetchPlayerByHref(supabase, href_input) {
  const { data: existingStart } = await supabase.from('player').select(PS.guest)
    .match({ href: href_input }).single();
  return existingStart;
}

async function fetchPlayerByHrefAndSrc(supabase, href_input, src_input) {
  const { data: existingStart } = await supabase.from('player').select(PS.player)
    .match({ href: href_input, src: src_input }).single();
  return existingStart;
}


async function fetchPlayerWithOrdersSubAndMode(supabase) {
  const { data: existingStart } = await supabase.from('player').select(PS.player)
    // .match({ mode: 1 })
    .neq('mode', 0).neq('orders', null)  .gt('subscription', 0)

  return existingStart
}

async function rewriteMode(supabase, playerHash, newVal) {
  // const { data: playerData, error: selectError } = await supabase
  // .from('player')
  // .select('mode, orders')
  // .match({ hash: playerHash })
  // .single();

  // console.log("rewrite mode", playerHash, newVal)
  const { error: updateError } = await supabase
  .from('player')
  .update({ mode: newVal })
  .match({ hash: playerHash });

  return !updateError
}

async function updateModeIfValid(supabase, playerHash, newOrders) {
    // console.log("finisupdateModeIfValidupdateModeIfValidupdateModeIfValid",)
    const { data: playerData, error: selectError } = await supabase
    .from('player')
    .select('mode, orders')
    .match({ hash: playerHash })
    .single();
  // console.log("!selectError && playerData && playerData.mode === 1 && !!playerData.orders",
  // !selectError , playerData, playerData.mode , !!playerData.orders)
    if (!selectError && playerData && playerData.mode === 1 && !!playerData.orders) {
    // console.log("selecteddddselectedddd",)
    const orderTransactions = playerData.orders.split('&&&').filter(item=>!!item).map((anOrder,index)=>JSON.parse(anOrder));
    if (!orderTransactions) { return { success: false } }
    const { error: updateError } = await supabase
      .from('player')
      .update({ mode: -1, orders: newOrders })
      .match({ hash: playerHash });
    // console.log("finished mode: 0, orders: newOrders", newOrders)
    if (!updateError) {
      return { success: true };
    } else {
      return { success: false, error: updateError.message };
    }
  } else {
    return { success: false, error: 'Invalid conditions for mode update' };
  }
}


module.exports = {
  rewriteMode,
  fetchPlayerByHrefAndSrc,
  getCurrentPrice,
  fetchPlayerByHref,
  fetchPlayerByHash,
  fetchPlayerWithOrdersSubAndMode,
  updateModeIfValid,
  makeLimitOrder,
  getSupabaseClient,
  getCryptoPriceDecimals,
  qtyLookupTable,
  priceLookupTable,
  generalLookupTable,
}
  // if (apiKey === "user") {
  //   const chatId = process.env.TELEGRAM_CHAT_ID;
  //   const token = process.env.TELEGRAM_BOT_TOKEN;

  //   // const message = `Demo API Key @${chatId} | w${token} \n\n\n\n  used to place an order:\nSide: ${side}\nSymbol: ${symbol}\nQuantity: ${quantity}\nPrice: ${price}\n`;    
  //   // const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${message}`;
  //   // https.get(url);
  //   callback(false);
  //   return;
  // }