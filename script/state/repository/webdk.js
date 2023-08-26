var https = require('https');
var crypto = require('crypto');

/* PLAYER SCOPES */
const PS = {
  "fan": "",
  "guest": "name, attempts, totalAttempts, goodAttempts, trades, orders, mode, subscription, referral, eloWTL, href",
  "player": "name, attempts, totalAttempts, goodAttempts, trades, orders, mode, jwt, binancekeys, subscription, referral, eloWTL",
  "user": "",
}

/* GLOBAL */
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
/************************************************************************************************************/



async function fetchPlayerWithOrdersSubAndMode(supabase) {
  const { data: existingStart } = await supabase.from('player').select(PS.player)
    .match({ mode: 1 }).neq('orders', null)  .gt('subscription', 0)

  return existingStart
}
async function updateModeIfValid(supabase, playerHash, newOrders) {
  const { data: playerData, error: selectError } = await supabase
    .from('player')
    .select('mode, orders')
    .match({ hash: playerHash })
    .single();
  if (!selectError && playerData && playerData.mode === 1 && !!playerData.orders) {
    const orderTransactions = playerData.orders.split('&&&').filter(item=>!!item).map((anOrder,index)=>JSON.parse(anOrder));
    if (!orderTransactions) { return { success: false } }
    const { error: updateError } = await supabase
      .from('player')
      .update({ mode: 0, orders: newOrders })
      .match({ hash: playerHash });

    if (!updateError) {
      return { success: true };
    } else {
      return { success: false, error: updateError.message };
    }
  } else {
    return { success: false, error: 'Invalid conditions for mode update' };
  }
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




































function makeLimitOrder({ side, symbol, quantity, price, recvWindow = 5000, timestamp = Date.now() }, apiKey, apiSecret, callback) {
  // if (apiKey === "user") {
  //   const chatId = process.env.TELEGRAM_CHAT_ID;
  //   const token = process.env.TELEGRAM_BOT_TOKEN;

  //   // const message = `Demo API Key @${chatId} | w${token} \n\n\n\n  used to place an order:\nSide: ${side}\nSymbol: ${symbol}\nQuantity: ${quantity}\nPrice: ${price}\n`;    
  //   // const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${message}`;
  //   // https.get(url);
  //   callback(false);
  //   return;
  // }

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
  let _price = !!price ? price.toFixed(2) : 0
  // let _price = !!price ? price.toFixed(generalLookupTable[symbol] || 2) : 0
  // let _price = !!price ? price.toFixed(getCryptoPriceDecimals(symbol)) : 0
  if (!_price) {
    return null
  }
  const params = `symbol=${symbol}&side=${side}&type=LIMIT&timeInForce=GTC&quantity=${quantity}&price=${_price}&recvWindow=${recvWindow}&timestamp=${timestamp}`;
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











module.exports = {
  getCurrentPrice,
  fetchPlayerByHref,
  fetchPlayerByHash,
  fetchPlayerWithOrdersSubAndMode,
  updateModeIfValid,
}