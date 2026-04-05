'use client'

import { createContext, useCallback, useContext, useState, ReactNode } from 'react'
import styles from './Toast.module.css'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
  exiting?: boolean
}

interface ToastContextType {
  toast: {
    success: (message: string) => void
    error: (message: string) => void
    warning: (message: string) => void
    info: (message: string) => void
  }
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 300)
  }, [])

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 4000)
  }, [removeToast])

  const toast = {
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
    warning: (msg: string) => addToast(msg, 'warning'),
    info: (msg: string) => addToast(msg, 'info'),
  }

  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className={styles.container}>
        {toasts.map(t => (
          <div
            key={t.id}
            className={`${styles.toast} ${styles[t.type]} ${t.exiting ? styles.exit : ''}`}
            onClick={() => removeToast(t.id)}
          >
            <span className={styles.icon}>{icons[t.type]}</span>
            <span className={styles.message}>{t.message}</span>
            <button className={styles.close} onClick={() => removeToast(t.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
