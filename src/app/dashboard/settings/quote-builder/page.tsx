'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DragDropProvider } from '@dnd-kit/react'
import { isSortable } from '@dnd-kit/react/sortable'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'
import { BlockPalette } from '@/components/quote-builder/BlockPalette'
import { BlockItem } from '@/components/quote-builder/BlockItem'
import { BlockConfig } from '@/components/quote-builder/BlockConfig'
import { QuotePreview } from '@/components/quote-builder/QuotePreview'
import { TemplateSelector } from '@/components/quote-builder/TemplateSelector'
import { ThemeConfig } from '@/components/quote-builder/ThemeConfig'
import { createDefaultBlock, DEFAULT_TEMPLATES, type QuoteLayout, type QuoteBlock, type BlockType } from '@/lib/types'
import styles from '@/components/quote-builder/quote-builder.module.css'

export default function QuoteBuilderPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const [layout, setLayout] = useState<QuoteLayout>({
    version: 1,
    theme: { primaryColor: '#0A66C2', secondaryColor: '#00D4AA', fontFamily: 'helvetica' },
    blocks: [],
  })

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase.from('profiles').select('company_id, avatar_url').eq('id', user.id).single()
      if (!profile?.company_id) { router.push('/onboarding'); return }

      setAvatarUrl(profile.avatar_url)

      const { data: company } = await supabase.from('companies').select('id, name, quote_layout').eq('id', profile.company_id).single()
      if (!company) return

      setCompanyId(company.id)
      setCompanyName(company.name)

      if (company.quote_layout) {
        setLayout(company.quote_layout as QuoteLayout)
      } else {
        // Start with default template
        setLayout(JSON.parse(JSON.stringify(DEFAULT_TEMPLATES.padrao.layout)))
      }

      setLoading(false)
    }
    fetchData()
  }, [supabase, router])

  const handleAddBlock = useCallback((type: BlockType) => {
    const newBlock = createDefaultBlock(type)
    setLayout(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }))
    setSelectedBlockId(newBlock.id)
  }, [])

  const handleRemoveBlock = useCallback((id: string) => {
    setLayout(prev => ({ ...prev, blocks: prev.blocks.filter(b => b.id !== id) }))
    if (selectedBlockId === id) setSelectedBlockId(null)
  }, [selectedBlockId])

  const handleUpdateBlock = useCallback((updated: QuoteBlock) => {
    setLayout(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === updated.id ? updated : b),
    }))
  }, [])

  const handleSelectTemplate = useCallback((key: string) => {
    const tpl = DEFAULT_TEMPLATES[key]
    if (tpl) {
      setLayout(JSON.parse(JSON.stringify(tpl.layout)))
      setSelectedBlockId(null)
      toast.success(`Template "${tpl.name}" carregado!`)
    }
  }, [toast])

  const handleSave = async () => {
    if (!companyId) return
    setSaving(true)

    const { error } = await supabase
      .from('companies')
      .update({ quote_layout: layout as unknown as Record<string, unknown> })
      .eq('id', companyId)

    if (error) {
      toast.error(`Erro ao salvar: ${error.message}`)
    } else {
      toast.success('Layout do orçamento salvo com sucesso!')
    }
    setSaving(false)
  }

  const selectedBlock = layout.blocks.find(b => b.id === selectedBlockId)

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" /></div>

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <Link href="/dashboard/settings" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Voltar às configurações
          </Link>
          <h1 className="page-title">🧱 Construtor de Orçamentos</h1>
          <p className="page-subtitle">Monte o modelo ideal arrastando e configurando blocos</p>
        </div>
        <button className="btn btn-accent" onClick={handleSave} disabled={saving}>
          {saving ? <span className="spinner" /> : '💾 Salvar Layout'}
        </button>
      </div>

      <div className={styles.builderLayout}>
        {/* Left: Editor */}
        <div className={styles.editorPanel}>
          <TemplateSelector onSelect={handleSelectTemplate} />
          <ThemeConfig theme={layout.theme} onChange={theme => setLayout(prev => ({ ...prev, theme }))} />
          <BlockPalette onAdd={handleAddBlock} />

          <div className={styles.blockList}>
            <div className={styles.blockListTitle}>
              <span>📐</span> Layout Atual ({layout.blocks.length} blocos)
            </div>
            {layout.blocks.length === 0 ? (
              <div className={styles.blockListEmpty}>
                Nenhum bloco adicionado.<br />Selecione um template ou adicione blocos acima.
              </div>
            ) : (
              <DragDropProvider
                onDragEnd={(event) => {
                  if (event.canceled) return
                  const { source } = event.operation
                  if (isSortable(source)) {
                    const { initialIndex, index } = source
                    if (initialIndex !== index) {
                      setLayout(prev => {
                        const blocks = [...prev.blocks]
                        const [removed] = blocks.splice(initialIndex, 1)
                        blocks.splice(index, 0, removed)
                        return { ...prev, blocks }
                      })
                    }
                  }
                }}
              >
                <div>
                  {layout.blocks.map((block, index) => (
                    <BlockItem
                      key={block.id}
                      block={block}
                      index={index}
                      isSelected={selectedBlockId === block.id}
                      onSelect={() => setSelectedBlockId(block.id === selectedBlockId ? null : block.id)}
                      onRemove={() => handleRemoveBlock(block.id)}
                    />
                  ))}
                </div>
              </DragDropProvider>
            )}
          </div>

          {selectedBlock && (
            <BlockConfig
              block={selectedBlock}
              onChange={handleUpdateBlock}
              onClose={() => setSelectedBlockId(null)}
            />
          )}
        </div>

        {/* Right: Preview */}
        <div className={styles.previewPanel}>
          <QuotePreview layout={layout} companyName={companyName} avatarUrl={avatarUrl} />
        </div>
      </div>
    </div>
  )
}
