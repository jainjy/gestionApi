const { createClient } = require("@supabase/supabase-js");
require('dotenv').config(); // ← AJOUT IMPORTANT!

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

console.log('🔧 Supabase configuré avec URL:', process.env.SUPABASE_URL ? '✅ OK' : '❌ MANQUANT');

module.exports = { supabase };