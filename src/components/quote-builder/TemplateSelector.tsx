'use client'

import { DEFAULT_TEMPLATES } from '@/lib/types'
import styles from './quote-builder.module.css'

interface TemplateSelectorProps {
  onSelect: (templateKey: string) => void
}

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  return (
    <div className={styles.templateSelector}>
      <h4 className={styles.paletteTitle}>Templates Prontos</h4>
      <div className={styles.templateGrid}>
        {Object.entries(DEFAULT_TEMPLATES).map(([key, tpl]) => (
          <button key={key} className={styles.templateCard} onClick={() => onSelect(key)}>
            <span className={styles.templateName}>{tpl.name}</span>
            <span className={styles.templateDesc}>{tpl.description}</span>
            <span className={styles.templateBlocks}>{tpl.layout.blocks.length} blocos</span>
          </button>
        ))}
      </div>
    </div>
  )
}
