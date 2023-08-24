
var https = require('https');
var crypto = require('crypto');
const { shortHash } = require('../../../script/util/helper/hash');
const { fetchPlayerWithOrdersSubAndMode } = require('../../../script/state/repository/player');
const { fetchPlayers } = require('../../../script/state/repository/players');
const { fetchPlayer, updateModeIfValid } = require('../../../script/state/repository/player');

const priceLookupTable = {
  'BTCUSDT': 1,
  'ETHUSDT': 5,
  'BNBUSDT': 4,
  'USDTUSDT': 4,
  'ADAUSDT': 4,
  'DOGEUSDT': 8,
  'XRPUSDT': 4,
  'DOTUSDT': 4,
  'LINKUSDT': 3,
  'FTMUSDT': 4,
  'UNIUSDT': 4,
  'SOLUSDT': 4,
};

function adjustOrderParams({ side, symbol, quantity, price }) {
  const pricedecimalPlaces = priceLookupTable[symbol.toUpperCase()] || 2;
  const adjustedQuantity = parseQuantity(symbol.toUpperCase(), quantity / price);
  const adjustedPrice = Number((parseFloat(`${price}`)).toFixed(pricedecimalPlaces));

  return { quantity: adjustedQuantity, price: adjustedPrice };
}

function getCouplesFromOrders(transactionString) {
  if (!transactionString) return []
  const transactions = transactionString.split('&&&').filter(Boolean);
  const trades = {};
  const completeTrades = [];
  transactions.forEach((transaction) => {
    try {
      const trade = JSON.parse(transaction);
      // console.log("trade", trade)
      const { symbol, isBuyer, price, qty } = trade;
      if (isBuyer) {
        if (!trades[symbol]) { trades[symbol] = []; }
        trades[symbol].push(trade);
      }
      if (!isBuyer) {
        if (trades[symbol] && trades[symbol].length >= 1) {
          const buyTrade = trades[symbol].shift();
          const profitLoss = (price - buyTrade.price) * qty;
          buyTrade.profitLoss = profitLoss;
          trade.profitLoss = profitLoss;
          completeTrades.push({ ...trade, entryPrice: buyTrade.price, closePrice: trade.price, }); 
          if (trades[symbol] && trades[symbol].length == 0) { delete trades[symbol]; }
        }
      }
    } catch (error) {
      console.error('Error parsing transaction:', error);
    }
  });
  return completeTrades;
}


async function generateInlineResults(queryText) {
  const randdd = parseInt(Math.random() * 100)
  const results = [];
  const textResult = {
    type: 'article',
    id: '1',
    name: 'name  Rrr #'+randdd,
    title: 'Text Result #'+randdd,
    subscription:0,
    input_message_content: {
      message_text: `You entered: ${queryText} \nYou got: ${randdd}`,
    },
  };
  
  // const foundHardcode = hardcode[queryText]
  let thePllayer = null;
  try {
    thePllayer = await fetchPlayer(queryText)
    console.log("player was found", )
  } catch (error) {
    console.log("player not found", queryText)
    thePllayer = {name:`player not found |${queryText}|`,subscription:0}
    
  }
  const betterResult = !thePllayer?.subscription ? textResult : {
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

function getStringFromProfits (tradeCouples) {
  return tradeCouples.map((eachTrade,index)=>{
    return `${eachTrade.symbol} -> ${eachTrade.profitLoss} | ${eachTrade.entryPrice} | ${eachTrade.closePrice}`
  }).join("\n")
}


async function setupPlayerStatsMessageBody(supabase,queryText, thePllayer) {
  let statsMessageReply = setupPlayerStatsMessageBody`Attempts <Avail. / Total - Good>: ${thePllayer.attempts} / ${thePllayer.totalAttempts} - ${thePllayer.goodAttempts}`
  statsMessageReply += `\nELO: ${thePllayer.eloWTL}`
  statsMessageReply += `\n\nProfits:\n${thePllayer.trades}`
  return statsMessageReply
}
async function reconstructPlayer(supabase,queryText) {
  
  let thePllayer = {trades:`guest #|${queryText}|`,subscription:0}


  // fetch player
  try {
    thePllayer = await fetchPlayer(supabase, queryText)
    let anotherString = ""
    let tradesString = thePllayer.trades
    theTradeString = tradesString
    let tradesList2 = getCouplesFromOrders(tradesString)
    let profitTradeList = tradesList2.filter((aTrade) => (aTrade.profitLoss > 0))
    let profitableTradeString = getStringFromProfits(profitTradeList)
    thePllayer.trades = anotherString + profitableTradeString

  } catch (error) {
    thePllayer = {trades:`unnamed #|${queryText}|`,subscription:0}
  }

  return thePllayer
}
async function generalQubUpdateMessage(supabase,queryText) {
  let thePllayers = []
  let theLastOrder = null
  let triggeredOrders = ""
  // fetch player
  try {
    console.log("pre")
    // let the_fetchPlayers = await fetchPlayers(supabase)
    // console.log("pre222",the_fetchPlayers)
    thePllayers = await fetchPlayerWithOrdersSubAndMode(supabase, queryText)
    if (thePllayers.length > 0) {
      thePllayers.map(async (thePllayer)=>{
        let lastOrder = ''
        const transactions = !!thePllayer.orders ? (
          thePllayer.orders.split('&&&').filter(item=>!!item).map((anOrder,index)=>JSON.parse(anOrder))
        ) : []
        if (transactions.length > 0) {
          theLastOrder = transactions[transactions.length-1]
          lastOrder = `theLastOrder:${JSON.stringify(theLastOrder)}`
        }
        if (!lastOrder) return
        if (!theLastOrder) return
        let currentPrrr = await getCurrentPrice()
        console.log("currentPrrrcurrentPrrr", currentPrrr)
        if (currentPrrr < theLastOrder.price) {
          console.log(`${thePllayer.hash} \n should \n trigger`)
          triggeredOrders += `|||${JSON.stringify(theLastOrder)}`
          await executeFinalTrade(supabase, thePllayer.hash, theLastOrder, thePllayer)
          console.log(`${thePllayer.hash} \n theLastOrder`)
        } else {
          console.log(`${thePllayer.hash} | ${theLastOrder.price} \n pending ***`)
        }
      })      
    }
    // console.log("post", thePllayers)

  } catch (error) {
    // console.log("error", error)
    thePllayers = []
  }

  return `${thePllayers.map((anItem,index)=>(JSON.stringify(anItem.hash))).join("\n")} \n\n
  triggered Orders ${triggeredOrders}`
}

async function getFinalTelegramCheckMessage(supabase,queryText) {
  let theLastOrder = null
  let thePllayer = await reconstructPlayer(supabase,queryText)
  let theMessageReply = `Check-in: #${shortHash(queryText)}`
  let statsMessageReply = setupPlayerStatsMessageBody(supabase,queryText, thePllayer)
  let theOrdersList = getCouplesFromOrders(thePllayer.orders)
  let lastOrder = theOrdersList.length > 0 ? theOrdersList[theOrdersList.length-1] : {}
  if ("startHash" in lastOrder) { delete lastOrder["startHash"] }
  const transactions = !!thePllayer.orders ? (
    thePllayer.orders.split('&&&').filter(item=>!!item).map((anOrder,index)=>JSON.parse(anOrder))
  ) : []
  if (transactions.length > 0) {
    theLastOrder = transactions[transactions.length-1]
    lastOrder = `theLastOrder:${JSON.stringify(theLastOrder)}`
  } else {
    lastOrder = `lastOrder from coupled:${JSON.stringify(lastOrder)}`
  }
  statsMessageReply += `\n\nLast Order:\n${lastOrder}`

  await executeFinalTrade(supabase, queryText, theLastOrder, thePllayer);

  return (`${theMessageReply}\n${statsMessageReply}\n\nStatus: ${!!thePllayer?.subscription ? "VIP" : "GUEST"} || ${thePllayer?.mode > 0 ? "mode:"+thePllayer?.mode : "idle"}`);
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

async function executeFinalTrade(supabase, queryText, theLastOrder, thePllayer) {
  if (thePllayer?.mode > 0 && !!thePllayer?.binancekeys) {
    if (!!theLastOrder && (theLastOrder.isBuyer || theLastOrder.side.toLowerCase() == "buy")) {
      await updateModeIfValid(supabase, queryText, null);
      let side = "buy";
      let symbol = "BTCUSDT";
      let quantity = "0.001";
      let price = theLastOrder.price;
      let apikeypublic = thePllayer.binancekeys.split(":")[0] || "";
      let apikeysecret = thePllayer.binancekeys.split(":")[1] || "";

      let orderSuccess = true;

      if ((`${apikeypublic}${apikeysecret}`).length == 128) {
        let theFinalTradeData = { side, symbol, quantity, price };
        console.log("makeLimitOrdermakeLimitOrder")
        makeLimitOrder(theFinalTradeData, apikeypublic, apikeysecret, (result) => {
          if (!result) {
            throw Error("no result in make limit order");
          }
        });
        console.log("makeLimitOrdermakeLimitOrder finalllllllllllllllllll")
      } else {
        orderSuccess = false;
      }
    }
  }
}


const generalLookupTable= {
  'BTC': 1,
  'ETH': 5,
  'BNB': 4,
  'USDT': 4,
  'ADA': 4,
  'DOGE': 8,
  'XRP': 4,
  'DOT': 4,
  'LINK': 3,
  'FTM': 4,
  'UNI': 4,
  'SOL': 4,
};
function getCryptoPriceDecimals(symbol) {
  return generalLookupTable[symbol] || 2;
}
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
  let _price = !!price ? price.toFixed(getCryptoPriceDecimals(symbol)) : 0
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
  getCouplesFromOrders,
  generateInlineResults,
  getStringFromProfits,
  getFinalTelegramCheckMessage,
  generalQubUpdateMessage,
  priceLookupTable,
  adjustOrderParams,
}