async function fetchPlayers(supabase) {
  const { data: existingStart, error: selectError } = await supabase
    .from('player')
    .select()
  return existingStart;
}
