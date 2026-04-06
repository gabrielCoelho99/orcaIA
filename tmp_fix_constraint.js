const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sql = `
  ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
  ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('free', 'pro', 'agency'));
`;

async function runSQL() {
  console.log('Tentando atualizar constraint de plano...')
  const { data, error } = await supabase.rpc('exec_sql', { query: sql })
  
  if (error) {
    console.error('Falha ao rodar RPC exec_sql (normal se não existir):', error)
    console.log('\n--- SQL PARA RODAR NO SUPABASE DASHBOARD ---')
    console.log(sql)
    console.log('---------------------------------------------')
  } else {
    console.log('Constraint atualizada com sucesso via RPC!')
  }
}

runSQL()
