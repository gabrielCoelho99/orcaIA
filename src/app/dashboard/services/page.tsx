'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Service } from '@/lib/types'
import styles from './services.module.css'

const PRICING_TYPES = [
  { value: 'fixed', label: 'Preço Fixo', desc: 'Valor único por serviço' },
  { value: 'per_km', label: 'Por Km', desc: 'Valor calculado pela distância' },
  { value: 'per_unit', label: 'Por Unidade', desc: 'Valor por peça/item' },
  { value: 'hourly', label: 'Por Hora', desc: 'Valor por hora trabalhada' },
  { value: 'per_area', label: 'Por m²', desc: 'Valor por metro quadrado' },
] as const

const UNITS: Record<string, string[]> = {
  fixed: ['serviço', 'unidade', 'diária', 'peça'],
  per_km: ['km'],
  per_unit: ['unidade', 'peça', 'kg', 'litro'],
  hourly: ['hora'],
  per_area: ['m²', 'm linear', 'm³'],
}

type FormState = {
  name: string
  description: string
  unit: string
  unit_price: string
  category: string
  pricing_type: string
  base_price: string
}

const INITIAL_FORM: FormState = {
  name: '',
  description: '',
  unit: 'unidade',
  unit_price: '',
  category: '',
  pricing_type: 'fixed',
  base_price: '',
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const fetchServices = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user!.id).single()
    const { data } = await supabase.from('services').select('*').eq('company_id', profile!.company_id).order('created_at', { ascending: false })
    setServices(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchServices() }, [])

  const resetForm = () => {
    setForm(INITIAL_FORM)
    setEditId(null)
    setShowForm(false)
  }

  const handleEdit = (service: Service) => {
    setForm({
      name: service.name,
      description: service.description || '',
      unit: service.unit,
      unit_price: String(service.unit_price),
      category: service.category || '',
      pricing_type: service.pricing_type || 'fixed',
      base_price: String(service.base_price || ''),
    })
    setEditId(service.id)
    setShowForm(true)
  }

  const handlePricingTypeChange = (pricingType: string) => {
    const defaultUnit = UNITS[pricingType]?.[0] || 'unidade'
    setForm(prev => ({ ...prev, pricing_type: pricingType, unit: defaultUnit }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user!.id).single()

    const payload = {
      company_id: profile!.company_id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      unit: form.unit,
      unit_price: parseFloat(form.unit_price) || 0,
      category: form.category.trim() || null,
      pricing_type: form.pricing_type,
      base_price: form.pricing_type === 'per_km' ? (parseFloat(form.base_price) || 0) : 0,
    }

    if (editId) {
      await supabase.from('services').update(payload).eq('id', editId)
    } else {
      await supabase.from('services').insert(payload)
    }

    resetForm()
    setSaving(false)
    fetchServices()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return
    await supabase.from('services').delete().eq('id', id)
    fetchServices()
  }

  const getPricingLabel = (service: Service) => {
    switch (service.pricing_type) {
      case 'per_km':
        return `R$ ${Number(service.base_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + R$ ${Number(service.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/km`
      default:
        return `R$ ${Number(service.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / ${service.unit}`
    }
  }

  const getPricingBadge = (type: string) => {
    const labels: Record<string, string> = {
      fixed: '💰 Fixo',
      per_km: '🛣️ Por Km',
      per_unit: '📦 Por Unidade',
      hourly: '⏱️ Por Hora',
      per_area: '📐 Por m²',
    }
    return labels[type] || type
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" /></div>

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Serviços</h1>
          <p className="page-subtitle">Cadastre os serviços que sua empresa oferece</p>
        </div>
        <button className="btn btn-accent" onClick={() => { resetForm(); setShowForm(true) }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo Serviço
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className={styles.formOverlay} onClick={(e) => { if (e.target === e.currentTarget) resetForm() }}>
          <div className={styles.formCard}>
            <h2>{editId ? 'Editar Serviço' : 'Novo Serviço'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className="input-group">
                <label htmlFor="serviceName">Nome do serviço *</label>
                <input id="serviceName" className="input" placeholder="Ex: Entrega expressa" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="input-group">
                <label htmlFor="serviceDesc">Descrição</label>
                <input id="serviceDesc" className="input" placeholder="Detalhes do serviço" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              {/* Pricing Type Selection */}
              <div className="input-group">
                <label>Tipo de precificação *</label>
                <div className={styles.pricingGrid}>
                  {PRICING_TYPES.map((pt) => (
                    <button
                      key={pt.value}
                      type="button"
                      className={`${styles.pricingBtn} ${form.pricing_type === pt.value ? styles.pricingSelected : ''}`}
                      onClick={() => handlePricingTypeChange(pt.value)}
                    >
                      <strong>{pt.label}</strong>
                      <small>{pt.desc}</small>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing Fields */}
              <div className={styles.formRow}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label htmlFor="servicePrice">
                    {form.pricing_type === 'per_km' ? 'Preço por km (R$) *' : 'Preço unitário (R$) *'}
                  </label>
                  <input id="servicePrice" className="input" type="number" step="0.01" min="0" placeholder="0,00" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: e.target.value })} required />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label htmlFor="serviceUnit">Unidade *</label>
                  <select id="serviceUnit" className="input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                    {(UNITS[form.pricing_type] || UNITS['fixed']).map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Base price for per_km */}
              {form.pricing_type === 'per_km' && (
                <div className="input-group">
                  <label htmlFor="basePrice">Taxa base / saída (R$)</label>
                  <input id="basePrice" className="input" type="number" step="0.01" min="0" placeholder="Ex: 15,00 (cobrado independente da distância)" value={form.base_price} onChange={e => setForm({ ...form, base_price: e.target.value })} />
                  <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Valor fixo cobrado além do preço por km (taxa de saída, por exemplo)
                  </small>
                </div>
              )}

              <div className="input-group">
                <label htmlFor="serviceCategory">Categoria</label>
                <input id="serviceCategory" className="input" placeholder="Ex: Entrega, Manutenção" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              </div>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancelar</button>
                <button type="submit" className="btn btn-accent" disabled={saving}>
                  {saving ? <span className="spinner" /> : editId ? 'Atualizar' : 'Criar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service list */}
      {services.length > 0 ? (
        <div className={styles.serviceGrid}>
          {services.map((service) => (
            <div key={service.id} className={`card ${styles.serviceCard}`}>
              <div className={styles.serviceHeader}>
                <h3>{service.name}</h3>
                <div className={styles.serviceActions}>
                  <button className="btn btn-icon btn-ghost" onClick={() => handleEdit(service)} title="Editar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button className="btn btn-icon btn-ghost" onClick={() => handleDelete(service.id)} title="Excluir">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
              {service.description && <p className={styles.serviceDesc}>{service.description}</p>}
              <div className={styles.serviceFooter}>
                <span className={styles.servicePrice}>
                  {getPricingLabel(service)}
                </span>
                <div className={styles.serviceTags}>
                  <span className={`badge ${styles.pricingBadge}`}>{getPricingBadge(service.pricing_type)}</span>
                  {service.category && <span className="badge badge-draft">{service.category}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          <h3>Nenhum serviço cadastrado</h3>
          <p>Cadastre seus serviços para que a IA possa usá-los nos orçamentos.</p>
          <button className="btn btn-accent" style={{ marginTop: '1rem' }} onClick={() => setShowForm(true)}>Cadastrar Primeiro Serviço</button>
        </div>
      )}
    </div>
  )
}
