'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Quote, QuoteItem } from '@/lib/types'
import { generateQuotePDF } from '@/lib/pdf'
import styles from './quote.module.css'

export default function QuoteDetailPage() {
  const { id } = useParams()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [items, setItems] = useState<QuoteItem[]>([])
  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
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
    fetch()
  }, [id])

  const handleDownloadPDF = () => {
    if (!quote || !company) return
    generateQuotePDF(quote, items, company)
  }

  const handleStatusChange = async (status: string) => {
    await supabase.from('quotes').update({ status }).eq('id', id)
    setQuote(prev => prev ? { ...prev, status: status as Quote['status'] } : null)
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" /></div>
  if (!quote) return <div className="empty-state"><h3>Orçamento não encontrado</h3></div>

  const statusLabels: Record<string, string> = { draft: 'Rascunho', sent: 'Enviado', approved: 'Aprovado', rejected: 'Rejeitado' }

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
          <select
            className="input"
            value={quote.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            style={{ width: 'auto' }}
          >
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

      {/* Quote Preview */}
      <div className={styles.quotePreview}>
        <div className={styles.quoteHeader}>
          <div>
            <h2 className={styles.companyName}>{company?.name}</h2>
            {company?.phone && <p>{company.phone}</p>}
            {company?.address && <p>{company.address}</p>}
          </div>
          <div className={styles.quoteMetaRight}>
            <span className={`badge badge-${quote.status}`}>{statusLabels[quote.status]}</span>
            <p>Validade: {quote.validity_days} dias</p>
          </div>
        </div>

        <div className={styles.clientInfo}>
          <h3>Cliente</h3>
          <p><strong>{quote.client_name}</strong></p>
          {quote.client_phone && <p>{quote.client_phone}</p>}
          {quote.client_email && <p>{quote.client_email}</p>}
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
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{item.unit}</td>
                <td>R$ {Number(item.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td className={styles.cellRight}>R$ {Number(item.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.quoteTotals}>
          <div className={styles.totalRow}>
            <span>Subtotal</span>
            <span>R$ {Number(quote.subtotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          {Number(quote.discount) > 0 && (
            <div className={styles.totalRow} style={{ color: 'var(--color-accent)' }}>
              <span>Desconto</span>
              <span>- R$ {Number(quote.discount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className={`${styles.totalRow} ${styles.totalFinal}`}>
            <span>Total</span>
            <span>R$ {Number(quote.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {quote.payment_terms && (
          <div className={styles.quoteSection}>
            <h3>Condições de Pagamento</h3>
            <p>{quote.payment_terms}</p>
          </div>
        )}

        {quote.notes && (
          <div className={styles.quoteSection}>
            <h3>Observações</h3>
            <p>{quote.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
