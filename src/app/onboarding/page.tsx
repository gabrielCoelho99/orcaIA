'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SEED_SERVICES } from '@/lib/data/seed-services'
import styles from './onboarding.module.css'

const BUSINESS_TYPES = [
  { value: 'oficina', label: '🔧 Oficina Mecânica', icon: '🔧' },
  { value: 'construcao', label: '🧱 Construção/Pedreiro', icon: '🧱' },
  { value: 'eletrica', label: '⚡ Elétrica', icon: '⚡' },
  { value: 'pintura', label: '🎨 Pintura', icon: '🎨' },
  { value: 'encanamento', label: '🔩 Encanamento', icon: '🔩' },
  { value: 'jardinagem', label: '🌿 Jardinagem', icon: '🌿' },
  { value: 'limpeza', label: '🧹 Limpeza', icon: '🧹' },
  { value: 'tecnologia', label: '💻 Tecnologia/TI', icon: '💻' },
  { value: 'outro', label: '📋 Outro', icon: '📋' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [companyName, setCompanyName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [customBusinessType, setCustomBusinessType] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleFinish = async () => {
    if (!companyName.trim() || !businessType) return
    if (businessType === 'outro' && !customBusinessType.trim()) return
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Sessão expirada. Faça login novamente.')
      setLoading(false)
      return
    }

    // Check if profile exists (trigger should have created it)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingProfile) {
      // Fallback: create profile manually if trigger didn't fire
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email || '',
        email: user.email || '',
        role: 'owner',
      })
    }

    const finalBusinessType = businessType === 'outro' ? customBusinessType.trim() : businessType

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyName.trim(),
        business_type: finalBusinessType,
        phone: phone.trim() || null,
        address: address.trim() || null,
        owner_id: user.id,
      })
      .select()
      .single()

    if (companyError || !company) {
      console.error('Company creation error:', companyError)
      setError(`Erro ao criar empresa: ${companyError?.message || 'Tente novamente.'}`)
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ company_id: company.id })
      .eq('id', user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      setError(`Erro ao vincular perfil: ${profileError.message}`)
      setLoading(false)
      return
    }

    // Create free subscription for the new company
    await supabase.from('subscriptions').insert({
      company_id: company.id,
      plan: 'free',
      quotes_limit: 5,
      services_limit: 3,
    })

    // Seed starter services based on business type
    const seedKey = businessType === 'outro' ? null : businessType
    const seedServices = seedKey ? SEED_SERVICES[seedKey] : null
    if (seedServices && seedServices.length > 0) {
      await supabase.from('services').insert(
        seedServices.map(s => ({
          company_id: company.id,
          name: s.name,
          description: s.description,
          unit: s.unit,
          unit_price: s.unit_price,
          category: s.category,
          pricing_type: s.pricing_type,
          base_price: s.base_price || 0,
          active: true,
        }))
      )
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className={styles.onboardingPage}>
      <div className={styles.onboardingGlow} />
      <div className={styles.onboardingCard}>
        <div className={styles.stepIndicator}>
          <div className={`${styles.stepDot} ${step >= 1 ? styles.active : ''}`} />
          <div className={styles.stepLine} />
          <div className={`${styles.stepDot} ${step >= 2 ? styles.active : ''}`} />
        </div>

        {step === 1 ? (
          <div className="fade-in">
            <h1>Sobre sua empresa</h1>
            <p className={styles.onboardingSubtext}>Vamos configurar tudo para que a IA conheça seus serviços.</p>

            <div className={styles.onboardingForm}>
              <div className="input-group">
                <label htmlFor="companyName">Nome da empresa</label>
                <input
                  id="companyName"
                  type="text"
                  className="input"
                  placeholder="Ex: Oficina do João"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Tipo de serviço</label>
                <div className={styles.typeGrid}>
                  {BUSINESS_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      className={`${styles.typeBtn} ${businessType === type.value ? styles.typeSelected : ''}`}
                      onClick={() => setBusinessType(type.value)}
                    >
                      <span className={styles.typeIcon}>{type.icon}</span>
                      <span>{type.label.split(' ').slice(1).join(' ')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {businessType === 'outro' && (
                <div className="input-group">
                  <label htmlFor="customBusiness">Qual é o ramo da sua empresa?</label>
                  <input
                    id="customBusiness"
                    type="text"
                    className="input"
                    placeholder="Ex: Fotografia, Personal Trainer, Consultoria..."
                    value={customBusinessType}
                    onChange={(e) => setCustomBusinessType(e.target.value)}
                    required
                  />
                  <small style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Isso ajuda a IA a entender melhor seu negócio
                  </small>
                </div>
              )}

              <button
                className="btn btn-accent btn-lg"
                style={{ width: '100%' }}
                onClick={() => setStep(2)}
                disabled={!companyName.trim() || !businessType || (businessType === 'outro' && !customBusinessType.trim())}
              >
                Continuar
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="fade-in">
            <h1>Quase lá!</h1>
            <p className={styles.onboardingSubtext}>Informações de contato (opcional).</p>

            <div className={styles.onboardingForm}>
              <div className="input-group">
                <label htmlFor="phone">Telefone / WhatsApp</label>
                <input
                  id="phone"
                  type="tel"
                  className="input"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label htmlFor="address">Endereço</label>
                <input
                  id="address"
                  type="text"
                  className="input"
                  placeholder="Rua, número, cidade"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              {error && <div style={{ padding: '0.625rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '0.8125rem' }}>{error}</div>}

              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button className="btn btn-ghost btn-lg" onClick={() => setStep(1)} style={{ flex: 1 }}>
                  Voltar
                </button>
                <button className="btn btn-accent btn-lg" onClick={handleFinish} disabled={loading} style={{ flex: 2 }}>
                  {loading ? <span className="spinner" /> : 'Criar empresa'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
