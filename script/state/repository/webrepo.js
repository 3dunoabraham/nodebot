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

module.exports = {
  fetchPlayerByHref,
  fetchPlayerByHash,
  fetchPlayerWithOrdersSubAndMode,
  updateModeIfValid,
}