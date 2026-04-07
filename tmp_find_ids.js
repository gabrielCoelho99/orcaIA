const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const email = 'gabrielmoraes1199@gmail.com'

async function findIds() {
  console.log(`Buscando IDs para o email: ${email}`)
  
  // Find profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, company_id, full_name')
    .eq('email', email)
    .single()

  if (profileError) {
    console.error('Erro ao buscar perfil:', profileError)
    return
  }

  console.log('Perfil encontrado:', profile)
}

findIds()
