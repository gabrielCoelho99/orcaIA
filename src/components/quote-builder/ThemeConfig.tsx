'use client'

import type { QuoteLayout } from '@/lib/types'
import styles from './quote-builder.module.css'

interface ThemeConfigProps {
  theme: QuoteLayout['theme']
  onChange: (theme: QuoteLayout['theme']) => void
}

export function ThemeConfig({ theme, onChange }: ThemeConfigProps) {
  return (
    <div className={styles.themeConfig}>
      <h4 className={styles.paletteTitle}>🎨 Tema</h4>
      <div className={styles.themeFields}>
        <div className={styles.themeField}>
          <label>Cor primária</label>
          <div className={styles.colorInput}>
            <input type="color" value={theme.primaryColor} onChange={e => onChange({ ...theme, primaryColor: e.target.value })} />
            <span>{theme.primaryColor}</span>
          </div>
        </div>
        <div className={styles.themeField}>
          <label>Cor secundária</label>
          <div className={styles.colorInput}>
            <input type="color" value={theme.secondaryColor} onChange={e => onChange({ ...theme, secondaryColor: e.target.value })} />
            <span>{theme.secondaryColor}</span>
          </div>
        </div>
        <div className={styles.themeField}>
          <label>Fonte</label>
          <select className="input" value={theme.fontFamily} onChange={e => onChange({ ...theme, fontFamily: e.target.value as QuoteLayout['theme']['fontFamily'] })}>
            <option value="helvetica">Helvetica (moderna)</option>
            <option value="times">Times (clássica)</option>
            <option value="courier">Courier (mono)</option>
          </select>
        </div>
      </div>
    </div>
  )
}
