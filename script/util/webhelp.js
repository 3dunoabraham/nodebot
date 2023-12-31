const PS_CORE = "name, attempts, totalAttempts, goodAttempts, trades, orders, mode, subscription, referral, eloWTL, href"
const PS = {
  "fan": "",
  "guest": "name, attempts, totalAttempts, goodAttempts, trades, orders, mode, subscription, referral, eloWTL, href",
  "player": "name, attempts, totalAttempts, hash, goodAttempts, trades, orders, mode, jwt, binancekeys, subscription, referral, eloWTL",
  "user": "",
}

const qtyLookupTable = {
  'BTCUSDT': 3,'ETHUSDT': 4,'BNBUSDT': 4,'USDTUSDT': 4,'ADAUSDT': 4,'DOGEUSDT': 8,
  'XRPUSDT': 4,'DOTUSDT': 4,'LINKUSDT': 3,'FTMUSDT': 4,'UNIUSDT': 4,'SOLUSDT': 4,
};

const priceLookupTable = {
  'BTCUSDT': 1,'ETHUSDT': 5,'BNBUSDT': 4,'USDTUSDT': 4,'ADAUSDT': 4,
  'DOGEUSDT': 8,'XRPUSDT': 4,'DOTUSDT': 4,'LINKUSDT': 3,'FTMUSDT': 4,
  'UNIUSDT': 4,'SOLUSDT': 4,
};

const generalLookupTable = {
  'BTC': 1,'ETH': 5,'BNB': 4,'USDT': 4,'ADA': 4,'DOGE': 8,
  'XRP': 4,'DOT': 4,'LINK': 3,'FTM': 4,'UNI': 4,'SOL': 4,
};

function getCryptoPriceDecimals(symbol) {
  return generalLookupTable[symbol] || 2;
}

function computeHash(firstValue, secondValue, createHash) {
  const hash = createHash('sha256');
  hash.update(firstValue.toLowerCase().replace(" ", ""));
  hash.update(secondValue.toLowerCase().replace(" ", ""));
  const hash_digest = hash.digest('hex');
  return hash_digest
}

function parseQuantity(symbol, quantity) {
  const qtydecimalPlaces = qtyLookupTable[symbol] || 2;
  return Number(parseFloat(`${quantity}`).toFixed(qtydecimalPlaces));
}

function adjustOrderParams({ side, symbol, quantity, price }) {
  const pricedecimalPlaces = priceLookupTable[symbol.toUpperCase()] || 2;
  const adjustedQuantity = parseQuantity(symbol.toUpperCase(), quantity / price);
  const adjustedPrice = Number((parseFloat(`${price}`)).toFixed(pricedecimalPlaces));

  return { quantity: adjustedQuantity, price: adjustedPrice };
}















function shortHash(address)
{
  return address.substr(0,4)+"..."+address.substr(address.length-4,address.length)
}


function getCouplesFromOrders(transactionString) {
  if (!transactionString) return []
  const transactions = transactionString.split('&&&').filter(Boolean);
  const trades = {};
  const completeTrades = [];
  transactions.forEach((transaction) => {
    try {
      const trade = JSON.parse(transaction);
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


module.exports = {
  getCouplesFromOrders,
  getStringFromProfits,
  priceLookupTable,
  adjustOrderParams,
  getCryptoPriceDecimals,
  shortHash,
  generalLookupTable,
  PS_CORE,
  PS,
  qtyLookupTable,
  getCryptoPriceDecimals,
  computeHash,
  parseQuantity,
}