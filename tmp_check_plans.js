const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan')
    .limit(10)
  
  if (error) {
    console.error('Erro ao buscar planos:', error)
  } else {
    console.log('Valores de planos existentes:', [...new Set(data.map(d => d.plan))])
  }
}

checkSchema()
