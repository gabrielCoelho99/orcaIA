import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import styles from './quotes.module.css'

export default async function QuotesListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user!.id).single()

  const { data: quotes } = await supabase
    .from('quotes')
    .select('*')
    .eq('company_id', profile!.company_id)
    .order('created_at', { ascending: false })

  const statusLabels: Record<string, string> = { draft: 'Rascunho', sent: 'Enviado', approved: 'Aprovado', rejected: 'Rejeitado' }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orçamentos</h1>
          <p className="page-subtitle">Todos os orçamentos gerados</p>
        </div>
        <Link href="/dashboard/quotes/new" className="btn btn-accent">
          Novo Orçamento
        </Link>
      </div>

      {quotes && quotes.length > 0 ? (
        <div className={styles.quotesTable}>
          <div className={styles.tableHeader}>
            <span>Cliente</span>
            <span>Data</span>
            <span>Status</span>
            <span>Total</span>
          </div>
          {quotes.map((q) => (
            <Link key={q.id} href={`/dashboard/quotes/${q.id}`} className={styles.tableRow}>
              <span className={styles.clientName}>{q.client_name}</span>
              <span className={styles.date}>{new Date(q.created_at).toLocaleDateString('pt-BR')}</span>
              <span><span className={`badge badge-${q.status}`}>{statusLabels[q.status]}</span></span>
              <span className={styles.total}>R$ {(q.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          <h3>Nenhum orçamento ainda</h3>
          <p>Use a IA para criar seu primeiro orçamento.</p>
          <Link href="/dashboard/quotes/new" className="btn btn-accent" style={{ marginTop: '1rem' }}>Criar Orçamento</Link>
        </div>
      )}
    </div>
  )
}
