const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

async function fetchPlayer(playerHash) {
  const { data: existingStart, error: selectError } = await supabase
    .from('player')
    .select('name, attempts, totalAttempts, goodAttempts, trades, mode, jwt, binancekeys, subscription, referral')
    .match({ hash: playerHash })
    .single();
  return existingStart;
}

module.exports = { fetchPlayer };
