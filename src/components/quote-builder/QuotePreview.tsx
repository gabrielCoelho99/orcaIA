'use client'

import type { QuoteLayout } from '@/lib/types'
import styles from './quote-builder.module.css'

interface QuotePreviewProps {
  layout: QuoteLayout
  companyName: string
  avatarUrl?: string | null
}

export function QuotePreview({ layout, companyName, avatarUrl }: QuotePreviewProps) {
  const { theme, blocks } = layout
  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })

  // Mock data for preview
  const mockClient = { name: 'João Silva', phone: '(11) 99999-0000', email: 'joao@email.com' }
  const mockItems = [
    { description: 'Serviço exemplo A', qty: 2, unit: 'unidade', price: 150, total: 300 },
    { description: 'Serviço exemplo B', qty: 1, unit: 'hora', price: 200, total: 200 },
  ]
  const mockTotals = { subtotal: 500, discount: 50, total: 450 }

  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewPaper} style={{ fontFamily: theme.fontFamily === 'helvetica' ? 'Inter, sans-serif' : theme.fontFamily === 'times' ? 'Georgia, serif' : 'monospace' }}>
        {blocks.map(block => {
          switch (block.type) {
            case 'header':
              return (
                <div key={block.id} className={styles.pvHeader} style={{ backgroundColor: block.config.bgColor, textAlign: block.config.alignment }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: block.config.alignment === 'center' ? 'center' : 'flex-start' }}>
                    {block.config.showLogo && avatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="Logo" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                    )}
                    {block.config.showLogo && !avatarUrl && (
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                        {companyName.charAt(0)}
                      </div>
                    )}
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>{companyName}</span>
                  </div>
                </div>
              )
            case 'contact':
              return (
                <div key={block.id} className={styles.pvSection} style={{ display: 'flex', gap: block.config.layout === 'inline' ? '1rem' : '0.25rem', flexDirection: block.config.layout === 'inline' ? 'row' : 'column', flexWrap: 'wrap', fontSize: '0.7rem', color: '#64748B' }}>
                  {block.config.fields.includes('phone') && <span>📞 (11) 99999-0000</span>}
                  {block.config.fields.includes('email') && <span>✉️ contato@empresa.com</span>}
                  {block.config.fields.includes('address') && <span>📍 Rua Exemplo, 123</span>}
                  {block.config.fields.includes('instagram') && <span>📷 @empresa</span>}
                  {block.config.fields.includes('whatsapp') && <span>💬 WhatsApp</span>}
                  {block.config.fields.includes('website') && <span>🌐 www.empresa.com</span>}
                </div>
              )
            case 'client':
              return (
                <div key={block.id} className={styles.pvSection}>
                  <div className={styles.pvSectionLabel}>CLIENTE</div>
                  <div style={{ display: 'flex', flexDirection: block.config.layout === 'horizontal' ? 'row' : 'column', gap: block.config.layout === 'horizontal' ? '1.5rem' : '0.15rem' }}>
                    {block.config.fields.includes('name') && <span style={{ fontWeight: 600 }}>{mockClient.name}</span>}
                    {block.config.fields.includes('phone') && <span style={{ color: '#64748B', fontSize: '0.75rem' }}>{mockClient.phone}</span>}
                    {block.config.fields.includes('email') && <span style={{ color: '#64748B', fontSize: '0.75rem' }}>{mockClient.email}</span>}
                  </div>
                </div>
              )
            case 'items_table':
              return (
                <div key={block.id} className={styles.pvSection}>
                  <table className={styles.pvTable}>
                    <thead>
                      <tr style={{ backgroundColor: theme.primaryColor, color: '#fff' }}>
                        {block.config.columns.includes('description') && <th>Serviço</th>}
                        {block.config.columns.includes('qty') && <th>Qtd</th>}
                        {block.config.columns.includes('unit') && <th>Unid.</th>}
                        {block.config.columns.includes('price') && <th>Valor</th>}
                        {block.config.columns.includes('total') && <th>Total</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {mockItems.map((item, i) => (
                        <tr key={i} style={{ backgroundColor: i % 2 === 1 ? block.config.zebraColor : 'transparent' }}>
                          {block.config.columns.includes('description') && <td>{item.description}</td>}
                          {block.config.columns.includes('qty') && <td style={{ textAlign: 'center' }}>{item.qty}</td>}
                          {block.config.columns.includes('unit') && <td style={{ textAlign: 'center' }}>{item.unit}</td>}
                          {block.config.columns.includes('price') && <td style={{ textAlign: 'right' }}>R$ {fmt(item.price)}</td>}
                          {block.config.columns.includes('total') && <td style={{ textAlign: 'right', fontWeight: 600 }}>R$ {fmt(item.total)}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            case 'photos':
              return (
                <div key={block.id} className={styles.pvSection}>
                  <div style={{ display: 'grid', gridTemplateColumns: block.config.layout === 'grid' ? '1fr 1fr' : `repeat(${block.config.maxPhotos}, 1fr)`, gap: '0.5rem' }}>
                    {Array.from({ length: Math.min(block.config.maxPhotos, 4) }).map((_, i) => (
                      <div key={i} style={{ background: '#E2E8F0', borderRadius: '4px', aspectRatio: '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.7rem', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>📷</span>
                        {block.config.showCaptions && <span>Foto {i + 1}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            case 'free_text':
              return (
                <div key={block.id} className={styles.pvSection}>
                  <p style={{ fontWeight: block.config.bold ? 700 : 400, color: block.config.color, fontSize: '0.75rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                    {block.config.content || 'Texto livre — clique em ⚙ para editar'}
                  </p>
                </div>
              )
            case 'totals':
              return (
                <div key={block.id} className={styles.pvSection} style={{ textAlign: block.config.position }}>
                  <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.25rem', minWidth: '180px' }}>
                    {block.config.showSubtotal && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B' }}>
                        <span>Subtotal</span><span>R$ {fmt(mockTotals.subtotal)}</span>
                      </div>
                    )}
                    {block.config.showDiscount && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: theme.secondaryColor }}>
                        <span>Desconto</span><span>- R$ {fmt(mockTotals.discount)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, color: theme.primaryColor, borderTop: '2px solid #E2E8F0', paddingTop: '0.35rem', marginTop: '0.15rem' }}>
                      <span>Total</span><span>R$ {fmt(mockTotals.total)}</span>
                    </div>
                  </div>
                </div>
              )
            case 'payment_terms':
              return (
                <div key={block.id} className={styles.pvSection}>
                  <div className={styles.pvSectionLabel}>CONDIÇÕES DE PAGAMENTO</div>
                  {block.config.layout === 'paragraph'
                    ? <p style={{ fontSize: '0.75rem', color: '#334155', margin: 0 }}>50% na aprovação + 50% na entrega</p>
                    : (
                      <ul style={{ fontSize: '0.75rem', color: '#334155', margin: 0, paddingLeft: '1.25rem' }}>
                        <li>50% na aprovação</li>
                        <li>50% na entrega</li>
                      </ul>
                    )
                  }
                </div>
              )
            case 'signature':
              return (
                <div key={block.id} className={styles.pvSection} style={{ display: 'grid', gridTemplateColumns: block.config.columns === 2 ? '1fr 1fr' : '1fr', gap: '2rem', marginTop: '1.5rem' }}>
                  {block.config.labels.slice(0, block.config.columns).map((label, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ borderTop: '1px solid #334155', marginBottom: '0.35rem', width: '100%' }} />
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{label}</span>
                    </div>
                  ))}
                </div>
              )
            case 'divider':
              return (
                <div key={block.id} style={{ padding: '0.5rem 1rem' }}>
                  <hr style={{ border: 'none', borderTop: `${block.config.thickness}px ${block.config.style} ${block.config.color}`, margin: 0 }} />
                </div>
              )
            case 'footer':
              return (
                <div key={block.id} className={styles.pvFooter}>
                  {block.config.text && <span>{block.config.text}</span>}
                  {block.config.showBranding && <span style={{ color: '#94A3B8' }}>Gerado por OrcaIA</span>}
                </div>
              )
            default:
              return null
          }
        })}
      </div>
    </div>
  )
}
