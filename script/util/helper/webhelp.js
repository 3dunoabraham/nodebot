

function shortHash(address)
{
  return address.substr(0,4)+"..."+address.substr(address.length-4,address.length)
}


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


function getStringFromProfits (tradeCouples) {
  return tradeCouples.map((eachTrade,index)=>{
    return `${eachTrade.symbol} -> ${eachTrade.profitLoss} | ${eachTrade.entryPrice} | ${eachTrade.closePrice}`
  }).join("\n")
}


async function setupPlayerStatsMessageBody(thePllayer) {
  let statsMessageReply = `Attempts <Avail. / Total - Good>: ${thePllayer.attempts} / ${thePllayer.totalAttempts} - ${thePllayer.goodAttempts}`
  statsMessageReply += `\nELO: ${thePllayer.eloWTL}`
  statsMessageReply += `\n\nProfits:\n${thePllayer.trades}`
  return statsMessageReply
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
const getCryptoPriceDecimals = (symbol) => {
  return generalLookupTable[symbol] || 2;
}

module.exports = {
  getCouplesFromOrders,
  getStringFromProfits,
  priceLookupTable,
  adjustOrderParams,
  getCryptoPriceDecimals,
  shortHash,
  generalLookupTable,
  setupPlayerStatsMessageBody,
}