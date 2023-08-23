var https = require('https');
var crypto = require('crypto');
const { shortHash } = require('../../../script/util/helper/hash');
const { fetchPlayer, updateModeIfValid } = require('../../../script/state/repository/player');

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


async function getFinalTelegramCheckMessage(supabase,queryText) {
  let theLastOrder = null

  let thePllayer = {trades:`guest #|${queryText}|`,subscription:0}
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

    let theMessageReply = `Check-in: #${shortHash(queryText)}`
    let statsMessageReply = `Attempts <Avail. / Total - Good>: ${thePllayer.attempts} / ${thePllayer.totalAttempts} - ${thePllayer.goodAttempts}`
    statsMessageReply += `\nELO: ${thePllayer.eloWTL}`
    statsMessageReply += `\n\nProfits:\n${thePllayer.trades}`
    // let theTradesList = getCouplesFromOrders(theTradeString)




    let theOrdersList = getCouplesFromOrders(thePllayer.orders)
    // console.log("theTradesList", theTradesList)
    let lastOrder = theOrdersList.length > 0 ? theOrdersList[theOrdersList.length-1] : {}
    if ("startHash" in lastOrder) {
      
      delete lastOrder["startHash"]
    }
    {
      // last trade exists
      // console.log("thePllayer.trades", theTradeString)
      
      // if (!theTradeString) return []
      const transactions = !!thePllayer.orders ? (
        thePllayer.orders.split('&&&').filter(item=>!!item).map((anOrder,index)=>JSON.parse(anOrder))
      ) : []
      console.log("length of transactions", transactions.length)
      if (transactions.length > 0) {
        theLastOrder = transactions[transactions.length-1]
        // console.log("theLastOrder", theLastOrder)
        lastOrder = `theLastOrder:${JSON.stringify(theLastOrder)}`
      } else {
        lastOrder = `lastOrder from coupled:${JSON.stringify(lastOrder)}`
      }
    }
  statsMessageReply += `\n\nLast Order:\n${lastOrder}`


  if (thePllayer?.mode > 0) {
    console.log("binancekeys", thePllayer?.binancekeys, theLastOrder, "***\n\n\n***")
    if (!!thePllayer?.binancekeys) {
      console.log("binancekeys", thePllayer)
      if (!!theLastOrder && (theLastOrder.isBuyer || theLastOrder.side.toLowerCase() == "buy")) {
        console.log("ready to  buy -ready to  buy -ready to  buy -ready to  buy -ready to  buy -")
        await updateModeIfValid(supabase, queryText, null)
        console.log("complete await updateModeIfValid(supabase, queryText)-")

        let side = "buy"
        let symbol = "BTCUSDT"
        let quantity = "0.001"
        let price = theLastOrder.price
        let apikeypublic = thePllayer.binancekeys.split(":")[0] || ""
        let apikeysecret = thePllayer.binancekeys.split(":")[1] || ""

        let orderSuccess = true

        if ((`${apikeypublic}${apikeysecret}`).length == 128) {
          console.log(`apikeypublic ${apikeypublic}${apikeysecret}`)
          let theFinalTradeData = { side, symbol, quantity, price }
          console.log("theFinalTradeDatatheFinalTradeData -", theFinalTradeData)
          // throw Error("no orders in alpha")
          makeLimitOrder( theFinalTradeData, apikeypublic, apikeysecret,
            (result) => { 
              if (!result) { throw Error("no result in make limit order") }
            }
          );
        } else {
          orderSuccess = false
        }
        
      }
    }
  }

  return (`${theMessageReply}\n${statsMessageReply}\n\nStatus: ${!!thePllayer?.subscription ? "VIP" : "GUEST"} || ${thePllayer?.mode > 0 ? "mode:"+thePllayer?.mode : "idle"}`);
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
}