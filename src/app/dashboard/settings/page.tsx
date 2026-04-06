'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'
import { getSubscription } from '@/lib/subscription'
import type { Company, Subscription } from '@/lib/types'
import { PLAN_DETAILS } from '@/lib/types'
import styles from './settings.module.css'

type Tab = 'company' | 'profile' | 'plan' | 'account'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('company')
  const [company, setCompany] = useState<Company | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null)
  const [servicesCount, setServicesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  // Editable state
  const [companyForm, setCompanyForm] = useState({ name: '', phone: '', email: '', address: '', business_type: '' })
  const [profileForm, setProfileForm] = useState({ full_name: '' })

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name, email, company_id')
        .eq('id', user.id)
        .single()

      if (!prof?.company_id) return

      setProfile({ full_name: prof.full_name, email: prof.email })
      setProfileForm({ full_name: prof.full_name })

      const [{ data: comp }, sub, { count }] = await Promise.all([
        supabase.from('companies').select('*').eq('id', prof.company_id).single(),
        getSubscription(prof.company_id),
        supabase.from('services').select('*', { count: 'exact', head: true }).eq('company_id', prof.company_id).eq('active', true),
      ])

      if (comp) {
        setCompany(comp as Company)
        setCompanyForm({
          name: comp.name || '',
          phone: comp.phone || '',
          email: comp.email || '',
          address: comp.address || '',
          business_type: comp.business_type || '',
        })
      }
      setSubscription(sub)
      setServicesCount(count || 0)
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleSaveCompany = async () => {
    if (!company) return
    setSaving(true)
    const { error } = await supabase.from('companies').update({
      name: companyForm.name.trim(),
      phone: companyForm.phone.trim() || null,
      email: companyForm.email.trim() || null,
      address: companyForm.address.trim() || null,
      business_type: companyForm.business_type.trim(),
    }).eq('id', company.id)

    if (error) toast.error(`Erro: ${error.message}`)
    else {
      toast.success('Dados da empresa atualizados!')
      setCompany(prev => prev ? { ...prev, ...companyForm } : null)
    }
    setSaving(false)
  }

  const handleSaveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name: profileForm.full_name.trim(),
    }).eq('id', user.id)

    if (error) toast.error(`Erro: ${error.message}`)
    else {
      toast.success('Perfil atualizado!')
      setProfile(prev => prev ? { ...prev, full_name: profileForm.full_name } : null)
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" /></div>

  const plan = subscription?.plan || 'free'
  const planInfo = PLAN_DETAILS[plan]
  const quotesUsed = subscription?.quotes_used_this_month || 0
  const quotesLimit = subscription?.quotes_limit || 5
  const servicesLimit = subscription?.services_limit || 3
  const quotesPercent = Math.min((quotesUsed / quotesLimit) * 100, 100)
  const servicesPercent = Math.min((servicesCount / servicesLimit) * 100, 100)

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'company', label: 'Empresa', icon: '🏢' },
    { key: 'profile', label: 'Perfil', icon: '👤' },
    { key: 'plan', label: 'Plano', icon: '💳' },
    { key: 'account', label: 'Conta', icon: '🔐' },
  ]

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Gerencie sua empresa, perfil e plano</p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.settingsTabs}>
        {tabs.map(t => (
          <button
            key={t.key}
            className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Company Tab */}
      {activeTab === 'company' && (
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>Dados da Empresa</h3>
          <div className={styles.formGrid}>
            <div className="input-group">
              <label>Nome da empresa *</label>
              <input className="input" value={companyForm.name} onChange={e => setCompanyForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="input-group">
              <label>Tipo de negócio *</label>
              <input className="input" value={companyForm.business_type} onChange={e => setCompanyForm(p => ({ ...p, business_type: e.target.value }))} />
            </div>
            <div className="input-group">
              <label>Telefone</label>
              <input className="input" value={companyForm.phone} onChange={e => setCompanyForm(p => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-9999" />
            </div>
            <div className="input-group">
              <label>E-mail</label>
              <input className="input" type="email" value={companyForm.email} onChange={e => setCompanyForm(p => ({ ...p, email: e.target.value }))} placeholder="contato@empresa.com" />
            </div>
            <div className={`input-group ${styles.formGridFull}`}>
              <label>Endereço</label>
              <input className="input" value={companyForm.address} onChange={e => setCompanyForm(p => ({ ...p, address: e.target.value }))} placeholder="Rua, número, cidade" />
            </div>
          </div>
          <div className={styles.formActions}>
            <button className="btn btn-accent" onClick={handleSaveCompany} disabled={saving}>
              {saving ? <span className="spinner" /> : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>Seu Perfil</h3>
          <div className={styles.formGrid}>
            <div className="input-group">
              <label>Nome completo</label>
              <input className="input" value={profileForm.full_name} onChange={e => setProfileForm({ full_name: e.target.value })} />
            </div>
            <div className="input-group">
              <label>E-mail</label>
              <input className="input" value={profile?.email || ''} disabled style={{ opacity: 0.5 }} />
              <small style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>O e-mail não pode ser alterado</small>
            </div>
          </div>
          <div className={styles.formActions}>
            <button className="btn btn-accent" onClick={handleSaveProfile} disabled={saving}>
              {saving ? <span className="spinner" /> : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {/* Plan Tab */}
      {activeTab === 'plan' && (
        <>
          <div className={styles.plansGrid}>
            {/* Free Plan */}
            <div className={`${styles.planCard} ${plan === 'free' ? styles.planCardActive : ''}`}>
              {plan === 'free' && <span className={styles.planBadge}>Atual</span>}
              <div className={styles.planName}>{PLAN_DETAILS.free.name}</div>
              <div className={styles.planPrice}>R$ 0 <small>/mês</small></div>
              <ul className={styles.planFeatures}>
                {PLAN_DETAILS.free.features.map(f => <li key={f}>{f}</li>)}
              </ul>
              {plan === 'free' && (
                <button className="btn btn-ghost" disabled style={{ width: '100%', opacity: 0.5 }}>Plano atual</button>
              )}
            </div>

            {/* Pro Plan */}
            <div className={`${styles.planCard} ${plan === 'pro' ? styles.planCardActive : ''}`}>
              {plan === 'pro' && <span className={styles.planBadge}>Atual</span>}
              <div className={styles.planName}>{PLAN_DETAILS.pro.name}</div>
              <div className={styles.planPrice}>R$ 49,90 <small>/mês</small></div>
              <ul className={styles.planFeatures}>
                {PLAN_DETAILS.pro.features.map(f => <li key={f}>{f}</li>)}
              </ul>
              {plan === 'free' ? (
                <button
                  className="btn btn-accent"
                  style={{ width: '100%' }}
                  onClick={async () => {
                    setCheckoutLoading(true);
                    try {
                      const res = await fetch('/api/checkout', { method: 'POST' });
                      const data = await res.json();
                      if (res.ok && data.init_point) {
                        window.location.href = data.init_point;
                      } else {
                        toast.error(data.error || 'Erro ao gerar checkout');
                        setCheckoutLoading(false);
                      }
                    } catch (err) {
                      toast.error('Ocorreu um erro no servidor.');
                      setCheckoutLoading(false);
                    }
                  }}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? <span className="spinner" /> : 'Fazer Upgrade'}
                </button>
              ) : (
                <button className="btn btn-ghost" disabled style={{ width: '100%', opacity: 0.5 }}>Plano atual</button>
              )}
            </div>
          </div>

          {/* Usage */}
          <div className={styles.usageSection}>
            <div className={styles.usageCard}>
              <h3 className={styles.sectionTitle}>Uso do mês</h3>

              <div className={styles.usageRow}>
                <span>Orçamentos</span>
                <span>{quotesUsed} / {plan === 'pro' ? '∞' : quotesLimit}</span>
              </div>
              <div className={styles.usageBar}>
                <div
                  className={`${styles.usageBarFill} ${quotesPercent >= 80 ? styles.usageBarFillWarning : ''}`}
                  style={{ width: plan === 'pro' ? '2%' : `${quotesPercent}%` }}
                />
              </div>

              <div className={styles.usageRow}>
                <span>Serviços cadastrados</span>
                <span>{servicesCount} / {plan === 'pro' ? '∞' : servicesLimit}</span>
              </div>
              <div className={styles.usageBar}>
                <div
                  className={`${styles.usageBarFill} ${servicesPercent >= 80 ? styles.usageBarFillWarning : ''}`}
                  style={{ width: plan === 'pro' ? '2%' : `${servicesPercent}%` }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className={styles.dangerSection}>
          <div className={styles.sectionCard} style={{ marginBottom: 'var(--space-lg)' }}>
            <h3 className={styles.sectionTitle}>Sessão</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-md)' }}>
              Sair da sua conta neste dispositivo.
            </p>
            <button className={styles.btnDanger} onClick={handleLogout}>
              Sair da conta
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
