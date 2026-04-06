'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'
import { generateQuotePDF } from '@/lib/pdf'
import type { Quote, QuoteItem, Company } from '@/lib/types'
import styles from './quote.module.css'

export default function QuoteDetailPage() {
  const { id } = useParams()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [items, setItems] = useState<QuoteItem[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  // Editable state
  const [editQuote, setEditQuote] = useState<Partial<Quote>>({})
  const [editItems, setEditItems] = useState<QuoteItem[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const { data: q } = await supabase.from('quotes').select('*').eq('id', id).single()
      if (q) {
        setQuote(q as Quote)
        const [{ data: itemsData }, { data: companyData }] = await Promise.all([
          supabase.from('quote_items').select('*').eq('quote_id', q.id).order('sort_order'),
          supabase.from('companies').select('*').eq('id', q.company_id).single(),
        ])
        setItems((itemsData || []) as QuoteItem[])
        setCompany(companyData)
      }
      setLoading(false)
    }
    fetchData()
  }, [id, supabase])

  const startEditing = () => {
    if (!quote) return
    setEditQuote({ ...quote })
    setEditItems(items.map(i => ({ ...i })))
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditing(false)
    setEditQuote({})
    setEditItems([])
  }

  const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    setEditItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      // recalculate item total
      if (field === 'quantity' || field === 'unit_price') {
        const qty = field === 'quantity' ? Number(value) : Number(updated[index].quantity)
        const price = field === 'unit_price' ? Number(value) : Number(updated[index].unit_price)
        updated[index].total = qty * price
      }
      // recalculate quote totals
      const subtotal = updated.reduce((sum, item) => sum + Number(item.total), 0)
      const discount = Number(editQuote.discount) || 0
      setEditQuote(prev => ({ ...prev, subtotal, total: subtotal - discount }))
      return updated
    })
  }

  const removeItem = (index: number) => {
    setEditItems(prev => {
      const updated = prev.filter((_, i) => i !== index)
      const subtotal = updated.reduce((sum, item) => sum + Number(item.total), 0)
      const discount = Number(editQuote.discount) || 0
      setEditQuote(p => ({ ...p, subtotal, total: subtotal - discount }))
      return updated
    })
  }

  const addItem = () => {
    setEditItems(prev => [...prev, {
      id: `new-${Date.now()}`,
      quote_id: quote!.id,
      service_id: null,
      description: '',
      quantity: 1,
      unit: 'unidade',
      unit_price: 0,
      total: 0,
      sort_order: prev.length,
    }])
  }

  const handleDiscountChange = (val: string) => {
    const discount = parseFloat(val) || 0
    const subtotal = editItems.reduce((sum, item) => sum + Number(item.total), 0)
    setEditQuote(prev => ({ ...prev, discount, subtotal, total: subtotal - discount }))
  }

  const handleSave = async () => {
    if (!quote || !editQuote) return
    setSaving(true)

    try {
      // Update quote
      const { error: quoteErr } = await supabase.from('quotes').update({
        client_name: editQuote.client_name,
        client_phone: editQuote.client_phone || null,
        client_email: editQuote.client_email || null,
        subtotal: editQuote.subtotal,
        discount: editQuote.discount,
        total: editQuote.total,
        payment_terms: editQuote.payment_terms || null,
        validity_days: editQuote.validity_days || 30,
        notes: editQuote.notes || null,
      }).eq('id', quote.id)

      if (quoteErr) { toast.error(`Erro: ${quoteErr.message}`); return }

      // Delete old items and insert new ones
      await supabase.from('quote_items').delete().eq('quote_id', quote.id)

      if (editItems.length > 0) {
        const { error: itemsErr } = await supabase.from('quote_items').insert(
          editItems.map((item, index) => ({
            quote_id: quote.id,
            description: item.description,
            quantity: Number(item.quantity),
            unit: item.unit,
            unit_price: Number(item.unit_price),
            total: Number(item.total),
            sort_order: index,
          }))
        )
        if (itemsErr) { toast.error(`Erro nos itens: ${itemsErr.message}`); return }
      }

      // Refresh data
      setQuote({ ...quote, ...editQuote } as Quote)
      setItems(editItems)
      setEditing(false)
      toast.success('Orçamento atualizado!')
    } catch {
      toast.error('Erro inesperado ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!quote || !company) return
    generateQuotePDF(quote, items, company)
  }

  const handleStatusChange = async (status: string) => {
    const { error } = await supabase.from('quotes').update({ status }).eq('id', id)
    if (error) { toast.error('Erro ao atualizar status.'); return }
    setQuote(prev => prev ? { ...prev, status: status as Quote['status'] } : null)
    toast.success('Status atualizado!')
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" /></div>
  if (!quote) return <div className="empty-state"><h3>Orçamento não encontrado</h3></div>

  const statusLabels: Record<string, string> = { draft: 'Rascunho', sent: 'Enviado', approved: 'Aprovado', rejected: 'Rejeitado' }
  const fmt = (n: number) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 })

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <Link href="/dashboard/quotes" className={styles.backLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Voltar
          </Link>
          <h1 className="page-title">Orçamento — {quote.client_name}</h1>
          <p className="page-subtitle">Criado em {new Date(quote.created_at).toLocaleDateString('pt-BR')}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          {!editing && (
            <button className="btn btn-ghost" onClick={startEditing}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Editar
            </button>
          )}
          <select className="input" value={quote.status} onChange={(e) => handleStatusChange(e.target.value)} style={{ width: 'auto' }}>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button className="btn btn-accent" onClick={handleDownloadPDF}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Baixar PDF
          </button>
        </div>
      </div>

      {/* Quote Preview / Edit */}
      <div className={styles.quotePreview}>
        <div className={styles.quoteHeader}>
          <div>
            <h2 className={styles.companyName}>{company?.name}</h2>
            {company?.phone && <p>{company.phone}</p>}
            {company?.address && <p>{company.address}</p>}
          </div>
          <div className={styles.quoteMetaRight}>
            <span className={`badge badge-${quote.status}`}>{statusLabels[quote.status]}</span>
            {editing ? (
              <div className="input-group" style={{ marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Validade (dias)</label>
                <input className="input" type="number" min="1" value={editQuote.validity_days || 30} onChange={e => setEditQuote(p => ({ ...p, validity_days: parseInt(e.target.value) || 30 }))} style={{ width: '80px' }} />
              </div>
            ) : (
              <p>Validade: {quote.validity_days} dias</p>
            )}
          </div>
        </div>

        {/* Client Info */}
        <div className={styles.clientInfo}>
          <h3>Cliente</h3>
          {editing ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="input-group">
                <label style={{ fontSize: '0.75rem' }}>Nome *</label>
                <input className="input" value={editQuote.client_name || ''} onChange={e => setEditQuote(p => ({ ...p, client_name: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.75rem' }}>Telefone</label>
                <input className="input" value={editQuote.client_phone || ''} onChange={e => setEditQuote(p => ({ ...p, client_phone: e.target.value }))} />
              </div>
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.75rem' }}>E-mail</label>
                <input className="input" type="email" value={editQuote.client_email || ''} onChange={e => setEditQuote(p => ({ ...p, client_email: e.target.value }))} />
              </div>
            </div>
          ) : (
            <>
              <p><strong>{quote.client_name}</strong></p>
              {quote.client_phone && <p>{quote.client_phone}</p>}
              {quote.client_email && <p>{quote.client_email}</p>}
            </>
          )}
        </div>

        {/* Items Table */}
        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th>Serviço</th>
              <th>Qtd</th>
              <th>Unidade</th>
              <th>Valor Unit.</th>
              <th>Total</th>
              {editing && <th style={{ width: '40px' }}></th>}
            </tr>
          </thead>
          <tbody>
            {(editing ? editItems : items).map((item, index) => (
              <tr key={item.id}>
                {editing ? (
                  <>
                    <td><input className="input" value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} style={{ minWidth: '120px' }} /></td>
                    <td><input className="input" type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)} style={{ width: '70px' }} /></td>
                    <td><input className="input" value={item.unit} onChange={e => updateItem(index, 'unit', e.target.value)} style={{ width: '90px' }} /></td>
                    <td><input className="input" type="number" min="0" step="0.01" value={item.unit_price} onChange={e => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)} style={{ width: '100px' }} /></td>
                    <td className={styles.cellRight}>R$ {fmt(item.total)}</td>
                    <td>
                      <button type="button" onClick={() => removeItem(index)} className={styles.removeBtn} title="Remover item">✕</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unit}</td>
                    <td>R$ {fmt(Number(item.unit_price))}</td>
                    <td className={styles.cellRight}>R$ {fmt(Number(item.total))}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {editing && (
          <button type="button" className="btn btn-ghost" onClick={addItem} style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
            + Adicionar item
          </button>
        )}

        {/* Totals */}
        <div className={styles.quoteTotals}>
          <div className={styles.totalRow}>
            <span>Subtotal</span>
            <span>R$ {fmt(editing ? Number(editQuote.subtotal) || 0 : Number(quote.subtotal))}</span>
          </div>
          {editing ? (
            <div className={styles.totalRow} style={{ color: 'var(--color-accent)' }}>
              <span>Desconto (R$)</span>
              <input className="input" type="number" min="0" step="0.01" value={editQuote.discount || 0} onChange={e => handleDiscountChange(e.target.value)} style={{ width: '120px', textAlign: 'right' }} />
            </div>
          ) : Number(quote.discount) > 0 ? (
            <div className={styles.totalRow} style={{ color: 'var(--color-accent)' }}>
              <span>Desconto</span>
              <span>- R$ {fmt(Number(quote.discount))}</span>
            </div>
          ) : null}
          <div className={`${styles.totalRow} ${styles.totalFinal}`}>
            <span>Total</span>
            <span>R$ {fmt(editing ? Number(editQuote.total) || 0 : Number(quote.total))}</span>
          </div>
        </div>

        {/* Payment Terms */}
        <div className={styles.quoteSection}>
          <h3>Condições de Pagamento</h3>
          {editing ? (
            <textarea className="input" rows={2} value={editQuote.payment_terms || ''} onChange={e => setEditQuote(p => ({ ...p, payment_terms: e.target.value }))} placeholder="Ex: 50% na entrada + 50% na entrega" style={{ resize: 'vertical' }} />
          ) : (
            <p>{quote.payment_terms || 'Não informado'}</p>
          )}
        </div>

        {/* Notes */}
        <div className={styles.quoteSection}>
          <h3>Observações</h3>
          {editing ? (
            <textarea className="input" rows={3} value={editQuote.notes || ''} onChange={e => setEditQuote(p => ({ ...p, notes: e.target.value }))} placeholder="Observações adicionais..." style={{ resize: 'vertical' }} />
          ) : (
            <p>{quote.notes || '—'}</p>
          )}
        </div>

        {/* Edit Actions */}
        {editing && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
            <button className="btn btn-ghost" onClick={cancelEditing}>Cancelar</button>
            <button className="btn btn-accent" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" /> : 'Salvar Alterações'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
