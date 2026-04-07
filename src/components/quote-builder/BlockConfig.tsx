'use client'

import type { QuoteBlock } from '@/lib/types'
import styles from './quote-builder.module.css'

interface BlockConfigProps {
  block: QuoteBlock
  onChange: (updated: QuoteBlock) => void
  onClose: () => void
}

export function BlockConfig({ block, onChange, onClose }: BlockConfigProps) {
  const updateConfig = (partial: Record<string, unknown>) => {
    onChange({ ...block, config: { ...block.config, ...partial } } as QuoteBlock)
  }

  return (
    <div className={styles.configPanel}>
      <div className={styles.configHeader}>
        <h4>Configurar Bloco</h4>
        <button onClick={onClose} className={styles.configClose}>✕</button>
      </div>
      <div className={styles.configBody}>
        {block.type === 'header' && (
          <>
            <label className={styles.configLabel}>
              <input type="checkbox" checked={block.config.showLogo} onChange={e => updateConfig({ showLogo: e.target.checked })} />
              Exibir logo
            </label>
            <div className={styles.configField}>
              <label>Cor de fundo</label>
              <input type="color" value={block.config.bgColor} onChange={e => updateConfig({ bgColor: e.target.value })} />
            </div>
            <div className={styles.configField}>
              <label>Alinhamento</label>
              <select className="input" value={block.config.alignment} onChange={e => updateConfig({ alignment: e.target.value })}>
                <option value="left">Esquerda</option>
                <option value="center">Centro</option>
              </select>
            </div>
          </>
        )}

        {block.type === 'contact' && (
          <>
            <div className={styles.configField}>
              <label>Campos visíveis</label>
              {(['phone', 'email', 'address', 'instagram', 'facebook', 'whatsapp', 'website'] as const).map(f => (
                <label key={f} className={styles.configLabel}>
                  <input
                    type="checkbox"
                    checked={block.config.fields.includes(f)}
                    onChange={e => {
                      const fields = e.target.checked
                        ? [...block.config.fields, f]
                        : block.config.fields.filter(x => x !== f)
                      updateConfig({ fields })
                    }}
                  />
                  {f === 'phone' ? 'Telefone' : f === 'email' ? 'E-mail' : f === 'address' ? 'Endereço' : f.charAt(0).toUpperCase() + f.slice(1)}
                </label>
              ))}
            </div>
            <div className={styles.configField}>
              <label>Layout</label>
              <select className="input" value={block.config.layout} onChange={e => updateConfig({ layout: e.target.value })}>
                <option value="inline">Em linha</option>
                <option value="stacked">Empilhado</option>
              </select>
            </div>
          </>
        )}

        {block.type === 'client' && (
          <>
            <div className={styles.configField}>
              <label>Campos visíveis</label>
              {(['name', 'phone', 'email'] as const).map(f => (
                <label key={f} className={styles.configLabel}>
                  <input
                    type="checkbox"
                    checked={block.config.fields.includes(f)}
                    onChange={e => {
                      const fields = e.target.checked
                        ? [...block.config.fields, f]
                        : block.config.fields.filter(x => x !== f)
                      updateConfig({ fields })
                    }}
                  />
                  {f === 'name' ? 'Nome' : f === 'phone' ? 'Telefone' : 'E-mail'}
                </label>
              ))}
            </div>
            <div className={styles.configField}>
              <label>Layout</label>
              <select className="input" value={block.config.layout} onChange={e => updateConfig({ layout: e.target.value })}>
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
              </select>
            </div>
          </>
        )}

        {block.type === 'items_table' && (
          <>
            <div className={styles.configField}>
              <label>Colunas visíveis</label>
              {(['description', 'qty', 'unit', 'price', 'total'] as const).map(f => (
                <label key={f} className={styles.configLabel}>
                  <input
                    type="checkbox"
                    checked={block.config.columns.includes(f)}
                    onChange={e => {
                      const columns = e.target.checked
                        ? [...block.config.columns, f]
                        : block.config.columns.filter(x => x !== f)
                      updateConfig({ columns })
                    }}
                  />
                  {f === 'description' ? 'Descrição' : f === 'qty' ? 'Qtd' : f === 'unit' ? 'Unidade' : f === 'price' ? 'Valor Unit.' : 'Total'}
                </label>
              ))}
            </div>
            <div className={styles.configField}>
              <label>Cor do zebrado</label>
              <input type="color" value={block.config.zebraColor} onChange={e => updateConfig({ zebraColor: e.target.value })} />
            </div>
          </>
        )}

        {block.type === 'photos' && (
          <>
            <div className={styles.configField}>
              <label>Máximo de fotos</label>
              <select className="input" value={block.config.maxPhotos} onChange={e => updateConfig({ maxPhotos: parseInt(e.target.value) })}>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
            <div className={styles.configField}>
              <label>Layout</label>
              <select className="input" value={block.config.layout} onChange={e => updateConfig({ layout: e.target.value })}>
                <option value="grid">Grade 2x2</option>
                <option value="row">Em linha</option>
              </select>
            </div>
            <label className={styles.configLabel}>
              <input type="checkbox" checked={block.config.showCaptions} onChange={e => updateConfig({ showCaptions: e.target.checked })} />
              Exibir legendas
            </label>
          </>
        )}

        {block.type === 'free_text' && (
          <>
            <div className={styles.configField}>
              <label>Conteúdo</label>
              <textarea className="input" rows={4} value={block.config.content} onChange={e => updateConfig({ content: e.target.value })} style={{ resize: 'vertical' }} />
            </div>
            <label className={styles.configLabel}>
              <input type="checkbox" checked={block.config.bold} onChange={e => updateConfig({ bold: e.target.checked })} />
              Negrito
            </label>
            <div className={styles.configField}>
              <label>Cor do texto</label>
              <input type="color" value={block.config.color} onChange={e => updateConfig({ color: e.target.value })} />
            </div>
          </>
        )}

        {block.type === 'totals' && (
          <>
            <label className={styles.configLabel}>
              <input type="checkbox" checked={block.config.showSubtotal} onChange={e => updateConfig({ showSubtotal: e.target.checked })} />
              Exibir subtotal
            </label>
            <label className={styles.configLabel}>
              <input type="checkbox" checked={block.config.showDiscount} onChange={e => updateConfig({ showDiscount: e.target.checked })} />
              Exibir desconto
            </label>
            <div className={styles.configField}>
              <label>Posição</label>
              <select className="input" value={block.config.position} onChange={e => updateConfig({ position: e.target.value })}>
                <option value="right">Direita</option>
                <option value="center">Centro</option>
              </select>
            </div>
          </>
        )}

        {block.type === 'payment_terms' && (
          <div className={styles.configField}>
            <label>Layout</label>
            <select className="input" value={block.config.layout} onChange={e => updateConfig({ layout: e.target.value })}>
              <option value="paragraph">Parágrafo</option>
              <option value="list">Lista</option>
            </select>
          </div>
        )}

        {block.type === 'signature' && (
          <>
            <div className={styles.configField}>
              <label>Colunas</label>
              <select className="input" value={block.config.columns} onChange={e => updateConfig({ columns: parseInt(e.target.value) })}>
                <option value={1}>1 coluna</option>
                <option value={2}>2 colunas</option>
              </select>
            </div>
            {block.config.labels.map((label, i) => (
              <div key={i} className={styles.configField}>
                <label>Label {i + 1}</label>
                <input className="input" value={label} onChange={e => {
                  const labels = [...block.config.labels]
                  labels[i] = e.target.value
                  updateConfig({ labels })
                }} />
              </div>
            ))}
          </>
        )}

        {block.type === 'divider' && (
          <>
            <div className={styles.configField}>
              <label>Estilo</label>
              <select className="input" value={block.config.style} onChange={e => updateConfig({ style: e.target.value })}>
                <option value="solid">Sólido</option>
                <option value="dashed">Tracejado</option>
                <option value="dotted">Pontilhado</option>
              </select>
            </div>
            <div className={styles.configField}>
              <label>Cor</label>
              <input type="color" value={block.config.color} onChange={e => updateConfig({ color: e.target.value })} />
            </div>
            <div className={styles.configField}>
              <label>Espessura (px)</label>
              <input className="input" type="number" min={1} max={5} value={block.config.thickness} onChange={e => updateConfig({ thickness: parseInt(e.target.value) || 1 })} />
            </div>
          </>
        )}

        {block.type === 'footer' && (
          <>
            <div className={styles.configField}>
              <label>Texto do rodapé</label>
              <input className="input" value={block.config.text} onChange={e => updateConfig({ text: e.target.value })} placeholder="Ex: CNPJ, contato, etc." />
            </div>
            <label className={styles.configLabel}>
              <input type="checkbox" checked={block.config.showBranding} onChange={e => updateConfig({ showBranding: e.target.checked })} />
              Exibir &quot;Gerado por OrcaIA&quot;
            </label>
          </>
        )}
      </div>
    </div>
  )
}
