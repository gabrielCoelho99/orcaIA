'use client'

import { useSortable } from '@dnd-kit/react/sortable'
import { BLOCK_META, type QuoteBlock } from '@/lib/types'
import styles from './quote-builder.module.css'

interface BlockItemProps {
  block: QuoteBlock
  index: number
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
}

export function BlockItem({ block, index, isSelected, onSelect, onRemove }: BlockItemProps) {
  const { ref, isDragging } = useSortable({ id: block.id, index })
  const meta = BLOCK_META[block.type]

  return (
    <div
      ref={ref}
      className={`${styles.blockItem} ${isSelected ? styles.blockItemSelected : ''} ${isDragging ? styles.blockItemDragging : ''}`}
      onClick={onSelect}
    >
      <div className={styles.blockDragHandle}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
        </svg>
      </div>
      <span className={styles.blockIcon}>{meta.icon}</span>
      <span className={styles.blockLabel}>{meta.label}</span>
      <div className={styles.blockActions}>
        <button className={styles.blockConfigBtn} onClick={(e) => { e.stopPropagation(); onSelect() }} title="Configurar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
          </svg>
        </button>
        <button className={styles.blockRemoveBtn} onClick={(e) => { e.stopPropagation(); onRemove() }} title="Remover">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
