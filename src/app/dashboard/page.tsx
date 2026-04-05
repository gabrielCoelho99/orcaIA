import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import styles from './page.module.css'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user!.id)
    .single()

  const companyId = profile?.company_id

  const [
    { count: servicesCount },
    { count: quotesCount },
    { data: recentQuotes },
  ] = await Promise.all([
    supabase.from('services').select('*', { count: 'exact', head: true }).eq('company_id', companyId!).eq('active', true),
    supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('company_id', companyId!),
    supabase.from('quotes').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }).limit(5),
  ])

  const approvedTotal = recentQuotes
    ?.filter(q => q.status === 'approved')
    .reduce((sum, q) => sum + (q.total || 0), 0) || 0

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral da sua empresa</p>
        </div>
        <Link href="/dashboard/quotes/new" className="btn btn-accent">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          Novo Orçamento
        </Link>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className="stat-card">
          <div className="stat-label">Serviços Ativos</div>
          <div className="stat-value">{servicesCount || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Orçamentos Gerados</div>
          <div className="stat-value">{quotesCount || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Aprovado</div>
          <div className="stat-value">
            R$ {approvedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Recent Quotes */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Orçamentos Recentes</h2>
          <Link href="/dashboard/quotes" className="btn btn-ghost btn-sm">Ver todos</Link>
        </div>

        {recentQuotes && recentQuotes.length > 0 ? (
          <div className={styles.quotesList}>
            {recentQuotes.map((quote) => (
              <Link key={quote.id} href={`/dashboard/quotes/${quote.id}`} className={styles.quoteRow}>
                <div className={styles.quoteInfo}>
                  <span className={styles.quoteClient}>{quote.client_name}</span>
                  <span className={styles.quoteDate}>
                    {new Date(quote.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className={styles.quoteRight}>
                  <span className={`badge badge-${quote.status}`}>
                    {quote.status === 'draft' && 'Rascunho'}
                    {quote.status === 'sent' && 'Enviado'}
                    {quote.status === 'approved' && 'Aprovado'}
                    {quote.status === 'rejected' && 'Rejeitado'}
                  </span>
                  <span className={styles.quoteTotal}>
                    R$ {(quote.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <h3>Nenhum orçamento ainda</h3>
            <p>Comece cadastrando seus serviços e depois crie seu primeiro orçamento com a IA!</p>
          </div>
        )}
      </div>
    </div>
  )
}
