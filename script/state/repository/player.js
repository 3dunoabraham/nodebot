async function fetchPlayer(supabase, playerHash) {
  const { data: existingStart, error: selectError } = await supabase
    .from('player')
    // .select()
    .select('name, attempts, totalAttempts, goodAttempts, trades, mode, jwt, binancekeys, subscription, referral, eloWTL')
    .match({ hash: playerHash })
    .single();
  return existingStart;
}

module.exports = {
  fetchPlayer,
}