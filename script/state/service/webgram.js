
var https = require('https');
var crypto = require('crypto');
const { fetchPlayerWithOrdersSubAndMode } = require('../repository/webrepo');
const { executeFinalTrade, reconstructPlayer, reconstructPlayerByHref, getCurrentPrice } = require('./webserve');
const { setupPlayerStatsMessageBody, shortHash } = require('../../util/helper/webhelp');
const { getCouplesFromOrders } = require('../../util/helper/webhelp');

async function generalQubUpdateMessage(supabase,queryText) {
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
        } else {
          console.log(`${Date.now()} some are pending | \n ******`)
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
async function generalQubTradeMessage(supabase,queryText) {
  let thePllayers = []
  let theLastOrder = null
  let triggeredOrders = ""
  // fetch player
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
        // console.log("currentPrrrcurrentPrrr", currentPrrr)
        if (currentPrrr < theLastOrder.price) {
          // console.log(`${thePllayer.hash} \n should \n trigger`)
          triggeredOrders += `|||${JSON.stringify(theLastOrder)}`
          await executeFinalTrade(supabase, thePllayer.hash, theLastOrder, thePllayer)
          // console.log(`${thePllayer.hash} \n theLastOrder`)
        } else {
          console.log(`${Date.now()} some are pending | \n ******`)
          // console.log(`${thePllayer.hash} | ${theLastOrder.price} \n pending ***`)
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
  console.log("****************************************")
  let thePllayer = await reconstructPlayerByHref(supabase,queryText)
  // console.log("reconstructPlayerByHref")
  // console.log("egfegegeg" , thePllayer)
  // console.log("reconstructPlayerByHref")
  // let thePllayer = await reconstructPlayer(supabase,queryText)
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

  await executeFinalTrade(supabase, queryText, theLastOrder, thePllayer);

  return (`${theMessageReply}\n${statsMessageReply}\n\nStatus: ${!!thePllayer?.subscription ? "VIP" : "GUEST"} || ${thePllayer?.mode > 0 ? "mode:"+thePllayer?.mode : "idle"}`);
}


module.exports = {
  getFinalTelegramCheckMessage,
  generalQubUpdateMessage,
  generalQubTradeMessage,
}