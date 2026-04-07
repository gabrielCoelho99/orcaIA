'use client'

import { CHANGELOG, type ChangelogFeature } from '@/lib/data/changelog'

const TAG_STYLES: Record<ChangelogFeature['tag'], { bg: string; color: string; label: string }> = {
  novo: { bg: 'rgba(0, 212, 170, 0.12)', color: '#00D4AA', label: 'Novo' },
  'correção': { bg: 'rgba(251, 146, 60, 0.12)', color: '#FB923C', label: 'Correção' },
  melhoria: { bg: 'rgba(10, 102, 194, 0.12)', color: '#0A66C2', label: 'Melhoria' },
}

export default function ChangelogPage() {
  return (
    <div className="fade-in" style={{ paddingBottom: '2rem' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notas de Atualização</h1>
          <p className="page-subtitle">Acompanhe as novidades e melhorias do OrcaIA</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        {CHANGELOG.map((item, id) => (
          <div key={id} style={{ 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--border-color)', 
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            ...(id === 0 ? { borderColor: 'rgba(0, 212, 170, 0.3)', boxShadow: '0 0 20px rgba(0, 212, 170, 0.05)' } : {}),
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                {item.title}{' '}
                <span style={{ color: 'var(--accent-primary)', fontSize: '1rem', marginLeft: '0.5rem' }}>v{item.version}</span>
                {id === 0 && (
                  <span style={{
                    marginLeft: '0.75rem',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0, 212, 170, 0.15)',
                    color: '#00D4AA',
                    verticalAlign: 'middle',
                  }}>Mais recente</span>
                )}
              </h2>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>{new Date(item.date).toLocaleDateString('pt-BR')}</span>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              {item.description}
            </p>

            <ul style={{ 
              listStyleType: 'none', 
              padding: 0, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem',
            }}>
              {item.features.map((feature, idx) => {
                const tagStyle = TAG_STYLES[feature.tag]
                return (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <span style={{
                      flexShrink: 0,
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: tagStyle.bg,
                      color: tagStyle.color,
                      marginTop: '0.15rem',
                      whiteSpace: 'nowrap',
                    }}>{tagStyle.label}</span>
                    <span style={{ color: 'var(--text-primary)', lineHeight: '1.5', fontSize: '0.9375rem' }}>{feature.text}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
