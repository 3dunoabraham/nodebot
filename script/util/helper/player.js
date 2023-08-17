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

module.exports = {
  getCouplesFromOrders,
  generateInlineResults,
  getStringFromProfits,
}