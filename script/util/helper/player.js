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
  let theLastOrder

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
    let theTradesList = getCouplesFromOrders(theTradeString)
    // console.log("theTradesList", theTradesList)
    let theLastTrade = theTradesList.length > 0 ? theTradesList[theTradesList.length-1] : {}
    if ("startHash" in theLastTrade) {
      
      delete theLastTrade["startHash"]
    }
    {
      // last trade exists
      // console.log("thePllayer.trades", theTradeString)
      
      // if (!theTradeString) return []
      const transactions = theTradeString.split('&&&').filter(item=>!!item).map((anOrder,index)=>JSON.parse(anOrder));
      console.log("length of transactions", transactions.length)
      if (transactions.length > 0) {
        theLastOrder = transactions[transactions.length-1]
        // console.log("theLastOrder", theLastOrder)
        theLastTrade = `theLastOrder:${JSON.stringify(theLastOrder)}`
      } else {
        theLastTrade = `theLastTrade:${JSON.stringify(theLastTrade)}`
      }
    }
  statsMessageReply += `\n\nLast:\n${theLastTrade}`


  if (thePllayer?.mode > 0) {
    console.log("binancekeys", thePllayer?.binancekeys, theLastOrder, "***\n\n\n***")
    if (!!thePllayer?.binancekeys) {
      console.log("binancekeys", thePllayer)
      if (theLastOrder.isBuyer) {
        console.log("ready to  buy -ready to  buy -ready to  buy -ready to  buy -ready to  buy -")
        await updateModeIfValid(supabase, queryText)
        console.log("complete await updateModeIfValid(supabase, queryText)-")
      }
    }
  }

  return (`${theMessageReply}\n${statsMessageReply}\n\nStatus: ${!!thePllayer?.subscription ? "VIP" : "GUEST"} || ${thePllayer?.mode > 0 ? "mode:"+thePllayer?.mode : "idle"}`);
}



module.exports = {
  getCouplesFromOrders,
  generateInlineResults,
  getStringFromProfits,
  getFinalTelegramCheckMessage,
}