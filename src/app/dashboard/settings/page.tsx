'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  const [profile, setProfile] = useState<{ full_name: string; email: string; avatar_url: string | null } | null>(null)
  const [ownedCompanies, setOwnedCompanies] = useState<Company[]>([])
  const [servicesCount, setServicesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  const [companyForm, setCompanyForm] = useState({ name: '', phone: '', email: '', address: '', business_type: '', cnpj: '', instagram: '', facebook: '', whatsapp: '', website: '' })
  const [profileForm, setProfileForm] = useState({ full_name: '', avatar_url: '' })
  const [uploading, setUploading] = useState(false)
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false)
  const [newCompanyForm, setNewCompanyForm] = useState({ name: '', business_type: '' })

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name, email, company_id, avatar_url')
        .eq('id', user.id)
        .single()

      if (!prof?.company_id) return

      setProfile({ full_name: prof.full_name, email: prof.email, avatar_url: prof.avatar_url })
      setProfileForm({ full_name: prof.full_name, avatar_url: prof.avatar_url || '' })

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
          instagram: comp.instagram || '',
          facebook: comp.facebook || '',
          whatsapp: comp.whatsapp || '',
          website: comp.website || '',
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
      instagram: companyForm.instagram.trim() || null,
      facebook: companyForm.facebook.trim() || null,
      whatsapp: companyForm.whatsapp.trim() || null,
      website: companyForm.website.trim() || null,
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
      avatar_url: profileForm.avatar_url.trim() || null,
    }).eq('id', user.id)

    if (error) toast.error(`Erro: ${error.message}`)
    else {
      toast.success('Perfil atualizado!')
      setProfile(prev => prev ? { ...prev, full_name: profileForm.full_name, avatar_url: profileForm.avatar_url || null } : null)
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    const fileExt = file.name.split('.').pop()
    const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`
    
    try {
      const { error: uploadError } = await supabase.storage.from('company_assets').upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError

      const fileUrl = supabase.storage.from('company_assets').getPublicUrl(fileName).data.publicUrl

      setProfileForm(prev => ({ ...prev, avatar_url: fileUrl }))
      toast.success('Foto carregada! Não esqueça de Salvar.')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido'
      toast.error(`Erro no upload: ${msg}`)
    } finally {
      setUploading(false)
    }
  }

  const handleCreateAgencyCompany = async () => {
    if (!newCompanyForm.name.trim() || !newCompanyForm.business_type.trim()) {
      toast.error('Preencha o nome e tipo de negócio.')
      return
    }
    if (ownedCompanies.length >= 5) {
      toast.error('Limite de 5 empresas atingido no plano Agência.')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSaving(true)
    const { data: newCompany, error: createError } = await supabase.from('companies').insert({
      name: newCompanyForm.name.trim(),
      business_type: newCompanyForm.business_type.trim(),
      owner_id: user.id,
    }).select().single()

    if (createError || !newCompany) {
      toast.error(`Erro: ${createError?.message || 'Falha ao criar empresa'}`)
      setSaving(false)
      return
    }

    // Create subscription with agency plan (inherits agency privileges)
    const { error: subError } = await supabase.from('subscriptions').insert({
      company_id: newCompany.id,
      plan: 'agency',
      status: 'active',
      quotes_limit: 999999,
      services_limit: 999999,
      quotes_used_this_month: 0,
    })

    if (subError) {
      // Rollback: delete the company if subscription failed
      await supabase.from('companies').delete().eq('id', newCompany.id)
      toast.error(`Erro ao configurar plano: ${subError.message}`)
      setSaving(false)
      return
    }

    // Update local state without switching active company
    setOwnedCompanies(prev => [...prev, newCompany as Company])
    setNewCompanyForm({ name: '', business_type: '' })
    setShowNewCompanyForm(false)
    toast.success(`Empresa "${newCompany.name}" criada! Use o seletor na sidebar para alternar.`)
    setSaving(false)
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

            {/* Social Media Fields */}
            <div className="input-group">
              <label>Instagram</label>
              <input className="input" value={companyForm.instagram} onChange={e => setCompanyForm(p => ({ ...p, instagram: e.target.value }))} placeholder="@suaempresa" />
            </div>
            <div className="input-group">
              <label>Facebook</label>
              <input className="input" value={companyForm.facebook} onChange={e => setCompanyForm(p => ({ ...p, facebook: e.target.value }))} placeholder="facebook.com/suaempresa" />
            </div>
            <div className="input-group">
              <label>WhatsApp</label>
              <input className="input" value={companyForm.whatsapp} onChange={e => setCompanyForm(p => ({ ...p, whatsapp: e.target.value }))} placeholder="(11) 99999-9999" />
            </div>
            <div className="input-group">
              <label>Website</label>
              <input className="input" value={companyForm.website} onChange={e => setCompanyForm(p => ({ ...p, website: e.target.value }))} placeholder="www.suaempresa.com" />
            </div>
            
          </div>

          {/* Quote Builder Link */}
          {plan !== 'free' && (
            <Link href="/dashboard/settings/quote-builder" style={{ textDecoration: 'none', display: 'block', marginTop: 'var(--space-lg)' }}>
              <div style={{ padding: '1.5rem', background: 'rgba(10, 102, 194, 0.05)', border: '1px solid rgba(10, 102, 194, 0.2)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.15s ease' }} onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-primary)')} onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(10, 102, 194, 0.2)')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>🧱</span>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>Construtor de Orçamentos</h4>
                  <span className={styles.proBadge} style={{ background: 'rgba(0, 212, 170, 0.15)', color: 'var(--accent-secondary)' }}>Pro</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                  Monte seus orçamentos arrastando blocos: cabeçalho, tabelas de itens, fotos, condições, assinatura e mais.
                </p>
                <span style={{ fontSize: '0.8125rem', color: 'var(--accent-primary)', fontWeight: 600 }}>Abrir editor →</span>
              </div>
            </Link>
          )}

          <div className={styles.formActions} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {plan === 'agency' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {!showNewCompanyForm ? (
                  <button 
                    className="btn btn-ghost" 
                    onClick={() => setShowNewCompanyForm(true)}
                    disabled={saving || ownedCompanies.length >= 5}
                  >
                    + Cadastrar nova empresa ({ownedCompanies.length}/5)
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', minWidth: '280px' }}>
                    <input 
                      className="input" 
                      placeholder="Nome da empresa" 
                      value={newCompanyForm.name} 
                      onChange={e => setNewCompanyForm(p => ({ ...p, name: e.target.value }))} 
                    />
                    <input 
                      className="input" 
                      placeholder="Tipo de negócio (ex: oficina)" 
                      value={newCompanyForm.business_type} 
                      onChange={e => setNewCompanyForm(p => ({ ...p, business_type: e.target.value }))} 
                    />
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowNewCompanyForm(false)}>Cancelar</button>
                      <button className="btn btn-accent btn-sm" onClick={handleCreateAgencyCompany} disabled={saving}>
                        {saving ? <span className="spinner" /> : 'Criar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
            {/* Avatar Upload */}
            <div className={`input-group ${styles.formGridFull}`}>
              <label>Foto / Logo</label>
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--bg-tertiary)', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {profileForm.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profileForm.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1.75rem', color: 'var(--text-tertiary)' }}>{profile?.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleAvatarUpload} disabled={uploading} style={{ fontSize: '0.8125rem' }} />
                  <small style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                    Sua foto ou logo aparecerá na sidebar e nos orçamentos em PDF.
                  </small>
                </div>
              </div>
            </div>
            <div className="input-group">
              <label>Nome completo</label>
              <input className="input" value={profileForm.full_name} onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div className="input-group">
              <label>E-mail</label>
              <input className="input" value={profile?.email || ''} disabled style={{ opacity: 0.5 }} />
              <small style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>O e-mail não pode ser alterado</small>
            </div>
          </div>
          <div className={styles.formActions}>
            <button className="btn btn-accent" onClick={handleSaveProfile} disabled={saving || uploading}>
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
                {'promoPrice' in details && details.promoPrice ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', textDecoration: 'line-through', opacity: 0.6 }}>
                      R$ {details.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <div className={styles.planPrice}>
                      R$ {details.promoPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                      <small>/mês</small>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-accent)' }}>
                      {'promoLabel' in details ? (details as { promoLabel: string }).promoLabel : ''}
                    </span>
                  </div>
                ) : (
                  <div className={styles.planPrice}>
                    R$ {details.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                    <small>/mês</small>
                  </div>
                )}
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
                  {item.features.map((f, idx) => <li key={idx}>{f.text}</li>)}
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
