const { fetchPlayerWithOrdersSubAndMode, updateModeIfValid, fetchPlayerByHash } = require('../repository/webdk');
const { getCurrentPrice, fetchPlayerByHref, rewriteMode, fetchPlayerByHrefAndSrc  } = require('../repository/webdk');
const { shortHash } = require('../../util/webhelp');
const { getCouplesFromOrders, getStringFromProfits } = require('../../util/webhelp');
const { makeLimitOrder } = require('../repository/webdk');


function setupPlayerStatsMessageBody(thePllayer) {
  let statsMessageReply = `Attempts <Avail. / Total - Good>: ${thePllayer.attempts} / ${thePllayer.totalAttempts} - ${thePllayer.goodAttempts}`
  statsMessageReply += `\nELO: ${thePllayer.eloWTL}`
  statsMessageReply += `\n\nProfits:\n${thePllayer.trades}`
  return statsMessageReply
}

async function executeFinalTrade(supabase, queryText, orderData, thePllayer) {
  if ((thePllayer?.mode == 1 || thePllayer?.mode != 1) && !!thePllayer?.binancekeys) {
    // if (!!orderData && (orderData.isBuyer || orderData.side.toLowerCase() == "buy")) {
    if (!!orderData) {
      await updateModeIfValid(supabase, queryText, thePllayer.orders);
      let side = orderData.side
      let symbol = "BTCUSDT";
      let quantity = "0.001";
      let price = orderData.price;
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

async function reconstructPlayer(supabase,queryText) {  
  let thePllayer = {trades:`guest #|${queryText}|`,subscription:0}
  try {
    thePllayer = await fetchPlayerByHash(supabase, queryText)
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

async function reconstructPlayerByHref(supabase,queryText) {  
  let thePllayer = {trades:`guest #|${queryText}|`,subscription:0}
  try {
    thePllayer = await fetchPlayerByHref(supabase, queryText)
    let anotherString = ""
    let tradesString = thePllayer.trades
    if (!!tradesString) {
      let tradesList2 = getCouplesFromOrders(tradesString)
      let profitTradeList = tradesList2.filter((aTrade) => (aTrade.profitLoss > 0))
      let profitableTradeString = ""
      try {
        profitableTradeString = getStringFromProfits(profitTradeList)
      } catch (error) {
        console.log("error while getStringFromProfits")
      }
      thePllayer.trades = anotherString + profitableTradeString
    }
  } catch (error) {
    thePllayer = {trades:`unnamed #|${queryText}|`,subscription:0}
  }
  return thePllayer
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
  let thePllayer = null;
  try {
    thePllayer = await fetchPlayerByHash(queryText)
  } catch (error) {
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

async function cronUpdatesDatabase(supabase,queryText) {
  let thePllayers = []
  let theFirstOrder = null
  let theLastOrder = null
  let triggeredOrders = ""
  try {
    thePllayers = await fetchPlayerWithOrdersSubAndMode(supabase)
    if (thePllayers.length > 0) {
      thePllayers.map(async (thePllayer)=>{
        let firstOrder = ''
        let lastOrder = ''
        const transactions = !!thePllayer.orders ? (
          thePllayer.orders.split('&&&').filter(item=>!!item).map((anOrder,index)=>JSON.parse(anOrder))
        ) : []
        if (transactions.length > 0) {
          theFirstOrder = transactions[0]
          theLastOrder = transactions[transactions.length-1]
          firstOrder = `theFirstOrder:${JSON.stringify(theFirstOrder)}`
          lastOrder = `theFirstOrder:${JSON.stringify(theLastOrder)}`
        }
        if (!lastOrder) return
        if (!firstOrder) return
        if (!theFirstOrder) return
        let currentPrrr = await getCurrentPrice()
        // console.log("123****-*-*", currentPrrr < theFirstOrder.price, currentPrrr > theLastOrder.price)
        if (currentPrrr < theFirstOrder.price && thePllayer.mode == 1) {
          triggeredOrders += `|||${JSON.stringify(theFirstOrder)}`
          await executeFinalTrade(supabase, thePllayer.hash, theFirstOrder, thePllayer)
        } else if (currentPrrr > theLastOrder.price) {
          triggeredOrders += `|||${JSON.stringify(theLastOrder)}`
          await executeFinalTrade(supabase, thePllayer.hash, theLastOrder, thePllayer)
        } else {
          // console.log("if (thePllayer.mode == -1) {",)
          if (thePllayer.mode == 2) {
            await rewriteMode(supabase, thePllayer.hash, -1)
          } else if (thePllayer.mode == -2) {
            await rewriteMode(supabase, thePllayer.hash, 1)
          }
          console.log(`${Date.now()} ******`)
        }
      })      
    }

  } catch (error) {
    thePllayers = []
  }

  return `${thePllayers.map((anItem,index)=>(JSON.stringify(anItem.hash))).join("\n")} \n\n
  triggered Orders ${triggeredOrders}`
}
async function generalQubTradeMessage(supabase,queryText) {
  let thePllayers = []
  let theLastOrder = null
  let triggeredOrders = ""
  try {
    thePllayers = await fetchPlayerWithOrdersSubAndMode(supabase)
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
        if (currentPrrr < theLastOrder.price) {
          triggeredOrders += `|||${JSON.stringify(theLastOrder)}`
          await executeFinalTrade(supabase, thePllayer.hash, theLastOrder, thePllayer)
        } else {
          console.log(`${Date.now()} some are pending | \n ******`)
        }
      })      
    }

  } catch (error) {
    thePllayers = []
  }

  return `${thePllayers.map((anItem,index)=>(JSON.stringify(anItem.hash))).join("\n")} \n\n
  triggered Orders ${triggeredOrders}`
}
async function updatePlayerMode(supabase,queryText, newVal, ctx_message_from_id) {
  // console.log("ctx_message_from_id", ctx_message_from_id)
  let thePllayer = null;
  try {
    thePllayer = await fetchPlayerByHrefAndSrc(supabase, queryText, ctx_message_from_id)
  } catch (error) {
    thePllayer = {name:`player not found |${queryText}|`,subscription:0}    
  }

  let updateRes = await rewriteMode(supabase, thePllayer.hash, newVal)
  return updateRes ? `mode change: success \n ${newVal}` : 'failed to set mode'
}

async function povCheckIn(supabase,queryText) {
  let theLastOrder = null
  let thePllayer = await reconstructPlayerByHref(supabase,queryText)
  let theMessageReply = `Check-in: #${shortHash(queryText)}`
  let statsMessageReply = setupPlayerStatsMessageBody(thePllayer)
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

  // await executeFinalTrade(supabase, queryText, theLastOrder, thePllayer);
  return (`${theMessageReply}\n${statsMessageReply}\n\nStatus: ${!!thePllayer?.subscription ? "VIP" : "GUEST"} || ${thePllayer?.mode > 0 ? "mode:"+thePllayer?.mode : "idle"}`);
}

async function generateInlineResults22(queryText,randdd) {
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
    thePllayer = await fetchPlayerByHash(queryText)
  } catch (error) {
    thePllayer = {name:`player not found`,subscription:0}
    
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

module.exports = {
  povCheckIn,
  cronUpdatesDatabase,
  generalQubTradeMessage,
  reconstructPlayer,
  generateInlineResults,
  reconstructPlayerByHref,
  setupPlayerStatsMessageBody,
  generateInlineResults22,
  updatePlayerMode,
}