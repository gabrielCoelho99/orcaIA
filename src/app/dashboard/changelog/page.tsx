'use client'

import { CHANGELOG } from '@/lib/data/changelog'

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
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>{item.title} <span style={{ color: 'var(--accent-primary)', fontSize: '1rem', marginLeft: '0.5rem' }}>v{item.version}</span></h2>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>{new Date(item.date).toLocaleDateString('pt-BR')}</span>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              {item.description}
            </p>

            <ul style={{ 
              listStyleType: 'disc', 
              paddingLeft: '1.5rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem',
              color: 'var(--text-secondary)'
            }}>
              {item.features.map((feature, idx) => (
                <li key={idx}>
                  <span style={{ color: 'var(--text-primary)' }}>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
