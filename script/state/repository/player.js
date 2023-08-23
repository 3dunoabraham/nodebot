

async function fetchPlayer(supabase, playerHash) {
  const { data: existingStart, error: selectError } = await supabase
    .from('player')
    // .select()
    .select('name, attempts, totalAttempts, goodAttempts, trades, orders, mode, jwt, binancekeys, subscription, referral, eloWTL')
    .match({ hash: playerHash })
    .single();
  return existingStart;
}

async function updateModeIfValid(supabase, playerHash, newOrders) {
  const { data: playerData, error: selectError } = await supabase
    .from('player')
    .select('mode, orders')
    .match({ hash: playerHash })
    .single();
  console.log("playerDataplayerDataplayerDataplayerDataplayerDataplayerData", playerData)
  console.log("playerDataplayerDataplayerDatanpm iplayerDataplayerDataplayerData", )
  if (!selectError && playerData && playerData.mode === 1 && !!playerData.orders) {

    const orderTransactions = theTradeString.split('&&&').filter(item=>!!item).map((anOrder,index)=>JSON.parse(anOrder));
    console.log("orderTransactions", orderTransactions)
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
  updateModeIfValid,
  fetchPlayer,
}