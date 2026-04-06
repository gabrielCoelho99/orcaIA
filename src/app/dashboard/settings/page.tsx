'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'
import { getSubscription } from '@/lib/subscription'
import type { Company, Subscription } from '@/lib/types'
import { PLAN_DETAILS } from '@/lib/types'
import { CHANGELOG } from '@/lib/data/changelog'
import styles from './settings.module.css'

type Tab = 'company' | 'profile' | 'plan' | 'updates' | 'account'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('company')
  const [company, setCompany] = useState<Company | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null)
  const [ownedCompanies, setOwnedCompanies] = useState<Company[]>([])
  const [servicesCount, setServicesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  const [companyForm, setCompanyForm] = useState({ name: '', phone: '', email: '', address: '', business_type: '', cnpj: '', logo_url: '', quote_template_url: '' })
  const [profileForm, setProfileForm] = useState({ full_name: '' })
  const [uploading, setUploading] = useState(false)

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

      const [{ data: comp }, { data: owned }, sub, { count }] = await Promise.all([
        supabase.from('companies').select('*').eq('id', prof.company_id).single(),
        supabase.from('companies').select('*').eq('owner_id', user.id),
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
          cnpj: comp.cnpj || '',
          logo_url: comp.logo_url || '',
          quote_template_url: comp.quote_template_url || '',
        })
      }
      setOwnedCompanies((owned || []) as Company[])
      setSubscription(sub)
      setServicesCount(count || 0)
      setLoading(false)
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      cnpj: companyForm.cnpj.trim() || null,
      logo_url: companyForm.logo_url.trim() || null,
      quote_template_url: companyForm.quote_template_url.trim() || null,
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, bucket: 'company_assets' | 'company_templates', field: 'logo_url' | 'quote_template_url') => {
    const file = event.target.files?.[0];
    if (!file || !company) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop()
    const fileName = `${company.id}-${Date.now()}.${fileExt}`
    
    try {
      const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file)
      if (uploadError) throw uploadError

      const fileUrl = bucket === 'company_assets' 
        ? supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl
        : fileName; // Save path for private buckets

      setCompanyForm(prev => ({ ...prev, [field]: fileUrl }))
      toast.success('Arquivo carregado! Não esqueça de Salvar.')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido'
      toast.error(`Erro no upload: ${msg}`)
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" /></div>

  const plan = subscription?.plan || 'free'
  const quotesUsed = subscription?.quotes_used_this_month || 0
  const quotesLimit = subscription?.quotes_limit || 5
  const servicesLimit = subscription?.services_limit || 3
  const quotesPercent = Math.min((quotesUsed / quotesLimit) * 100, 100)
  const servicesPercent = Math.min((servicesCount / servicesLimit) * 100, 100)

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'company', label: 'Empresa', icon: '🏢' },
    { key: 'profile', label: 'Perfil', icon: '👤' },
    { key: 'plan', label: 'Plano', icon: '💳' },
    { key: 'updates', label: 'Novidades', icon: '✨' },
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
            
            <div className={`input-group ${styles.formGridFull}`}>
              <label>CNPJ <span className={styles.proBadge}>Opcional</span></label>
              <input className="input" value={companyForm.cnpj} onChange={e => setCompanyForm(p => ({ ...p, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" />
            </div>
            
            {plan !== 'free' && (
              <>
                <div className={`input-group ${styles.formGridFull}`}>
                  <label>Logo da Empresa <span className={styles.proBadge}>Pro/Agência</span></label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {companyForm.logo_url && <img src={companyForm.logo_url} alt="Logo" style={{ height: '40px', borderRadius: '4px' }} />}
                    <input type="file" accept="image/png, image/jpeg" onChange={e => handleFileUpload(e, 'company_assets', 'logo_url')} disabled={uploading} />
                  </div>
                  <small style={{color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: '4px'}}>
                    Faça o upload da sua logo (PNG/JPG) para aparecer em seus orçamentos PDF/Online.
                  </small>
                </div>

                <div className={`input-group ${styles.formGridFull}`}>
                  <label>Modelo Base de Orçamento <span className={styles.proBadge}>Pro/Agência</span></label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {companyForm.quote_template_url && <span style={{fontSize: '0.875rem', color: 'var(--accent-primary)'}}>Arquivo anexado: {companyForm.quote_template_url}</span>}
                    <input type="file" accept=".pdf,.doc,.docx" onChange={e => handleFileUpload(e, 'company_templates', 'quote_template_url')} disabled={uploading} />
                  </div>
                  <small style={{color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: '4px'}}>
                    Faça o upload do seu timbrado ou modelo base em PDF/Word. A IA utilizará este arquivo como referência.
                  </small>
                </div>
              </>
            )}
          </div>
          <div className={styles.formActions} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {plan === 'agency' ? (
              <button 
                className="btn btn-ghost" 
                onClick={async () => {
                  const { data: { user } } = await supabase.auth.getUser()
                  if (!user) return
                  setSaving(true)
                  const { data: newCompany, error: createError } = await supabase.from('companies').insert({
                    name: 'Nova Empresa',
                    owner_id: user.id
                  }).select().single()
                  if (createError) {
                    toast.error(`Erro: ${createError.message}`)
                    setSaving(false)
                    return
                  }
                  await supabase.from('subscriptions').insert({
                    company_id: newCompany.id,
                    plan: 'free',
                    status: 'active'
                  })
                  await supabase.from('profiles').update({ company_id: newCompany.id }).eq('id', user.id)
                  window.location.reload()
                }} 
                disabled={saving}
              >
                + Cadastrar nova empresa
              </button>
            ) : <div />}
            <button className="btn btn-accent" onClick={handleSaveCompany} disabled={saving || uploading}>
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
            {Object.entries(PLAN_DETAILS).map(([key, details]) => (
              <div 
                key={key} 
                className={`${styles.planCard} ${plan === key ? styles.planCardActive : ''} ${key === 'agency' ? styles.planCardAgency : ''}`}
              >
                {plan === key && <span className={styles.planBadge}>Atual</span>}
                {key === 'pro' && plan !== 'pro' && <span className={styles.planBadgePopular}>Recomendado</span>}
                <div className={styles.planName}>{details.name}</div>
                <div className={styles.planPrice}>
                  R$ {details.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                  <small>/mês</small>
                </div>
                <ul className={styles.planFeatures}>
                  {details.features.map(f => <li key={f}>{f}</li>)}
                </ul>
                
                {plan === key ? (
                  <button className="btn btn-ghost" disabled style={{ width: '100%', opacity: 0.5 }}>
                    Plano atual
                  </button>
                ) : (
                  <button
                    className={`btn ${key === 'pro' ? 'btn-accent' : 'btn-primary'}`}
                    style={{ width: '100%' }}
                    onClick={async () => {
                      setCheckoutLoading(true);
                      try {
                        const { data: { session } } = await supabase.auth.getSession();
                        
                        const res = await fetch('/api/checkout', { 
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${session?.access_token}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ plan: key })
                        });
                        const data = await res.json();
                        if (res.ok && data.init_point) {
                          window.location.href = data.init_point;
                        } else {
                          toast.error(data.error || 'Erro ao gerar checkout');
                          setCheckoutLoading(false);
                        }
                      } catch {
                        toast.error('Ocorreu um erro no servidor.');
                        setCheckoutLoading(false);
                      }
                    }}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? <span className="spinner" /> : (key === 'free' ? 'Downgrade' : 'Fazer Upgrade')}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Usage */}
          <div className={styles.usageSection}>
            <div className={styles.usageCard}>
              <h3 className={styles.sectionTitle}>Uso do mês</h3>

              <div className={styles.usageRow}>
                <span>Orçamentos</span>
                <span>{quotesUsed} / {plan !== 'free' ? '∞' : quotesLimit}</span>
              </div>
              <div className={styles.usageBar}>
                <div
                  className={`${styles.usageBarFill} ${quotesPercent >= 80 ? styles.usageBarFillWarning : ''}`}
                  style={{ width: plan !== 'free' ? '2%' : `${quotesPercent}%` }}
                />
              </div>

              <div className={styles.usageRow}>
                <span>Serviços cadastrados</span>
                <span>{servicesCount} / {plan !== 'free' ? '∞' : servicesLimit}</span>
              </div>
              <div className={styles.usageBar}>
                <div
                  className={`${styles.usageBarFill} ${servicesPercent >= 80 ? styles.usageBarFillWarning : ''}`}
                  style={{ width: plan !== 'free' ? '2%' : `${servicesPercent}%` }}
                />
              </div>
              
              {plan === 'agency' && (
                <>
                  <div className={styles.usageRow} style={{ marginTop: '1rem' }}>
                    <span>Empresas gerenciadas</span>
                    <span>{ownedCompanies.length} / 5</span>
                  </div>
                  <div className={styles.usageBar}>
                    <div
                      className={styles.usageBarFill}
                      style={{ width: `${(ownedCompanies.length / 5) * 100}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Updates Tab */}
      {activeTab === 'updates' && (
        <div className={styles.changelogSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Notas de Atualização</h3>
            <p className={styles.sectionSubtitle}>O que mudou recentemente no OrcaIA</p>
          </div>
          <div className={styles.changelogGrid}>
            {CHANGELOG.map((item, id) => (
              <div key={id} className={styles.changelogCard}>
                <div className={styles.changelogMeta}>
                  <span className={styles.versionTag}>v{item.version}</span>
                  <span className={styles.dateTag}>{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                </div>
                <h4 className={styles.changelogTitle}>{item.title}</h4>
                <p className={styles.changelogDesc}>{item.description}</p>
                <ul className={styles.featureList}>
                  {item.features.map((f, idx) => <li key={idx}>{f}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
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
