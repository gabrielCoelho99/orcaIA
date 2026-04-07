'use client'

import { BLOCK_META, type BlockType } from '@/lib/types'
import styles from './quote-builder.module.css'

const ALL_BLOCKS: BlockType[] = ['header', 'contact', 'client', 'items_table', 'photos', 'free_text', 'totals', 'payment_terms', 'signature', 'divider', 'footer']

export function BlockPalette({ onAdd }: { onAdd: (type: BlockType) => void }) {
  return (
    <div className={styles.palette}>
      <h4 className={styles.paletteTitle}>Blocos Disponíveis</h4>
      <div className={styles.paletteGrid}>
        {ALL_BLOCKS.map(type => {
          const meta = BLOCK_META[type]
          return (
            <button
              key={type}
              className={styles.paletteItem}
              onClick={() => onAdd(type)}
              title={meta.description}
            >
              <span className={styles.paletteIcon}>{meta.icon}</span>
              <span className={styles.paletteLabel}>{meta.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
