const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente não encontradas.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const companyId = 'cfab7599-8316-42e8-8920-20b1fe65f3e9'

async function updatePlan() {
  console.log(`Atualizando plano para a empresa: ${companyId}`)
  
  // Check if exists
  const { data: sub, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('company_id', companyId)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Erro ao buscar assinatura:', fetchError)
    return
  }

  if (sub) {
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ plan: 'agency', status: 'active' })
      .eq('company_id', companyId)
    
    if (updateError) console.error('Erro ao atualizar plano:', updateError)
    else console.log('Plano atualizado para AGENCY com sucesso!')
  } else {
    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert({ company_id: companyId, plan: 'agency', status: 'active' })
    
    if (insertError) console.error('Erro ao inserir assinatura:', insertError)
    else console.log('Assinatura AGENCY criada com sucesso!')
  }
}

updatePlan()
