'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './auth.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Email ou senha incorretos.'
        : error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authGlow} />
      <div className={styles.authCard}>
        <Link href="/" className={styles.authLogo}>
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" stroke="url(#gradL)" strokeWidth="2" fill="none"/>
            <path d="M10 18C10 14 13 10 16 10C19 10 22 14 22 18C22 22 19 24 16 24C13 24 10 22 10 18Z" fill="url(#gradL)"/>
            <circle cx="14" cy="16" r="1.5" fill="#0F1419"/>
            <defs><linearGradient id="gradL" x1="0" y1="0" x2="32" y2="32"><stop offset="0%" stopColor="#00D4AA"/><stop offset="100%" stopColor="#0A66C2"/></linearGradient></defs>
          </svg>
          <span>OrcaIA</span>
        </Link>
        <h1>Entrar na sua conta</h1>
        <p className={styles.authSubtext}>Bem-vindo de volta! Acesse seus orçamentos.</p>

        <form onSubmit={handleLogin} className={styles.authForm}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className={styles.authError}>{error}</div>}

          <button type="submit" className="btn btn-accent btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Entrar'}
          </button>
        </form>

        <p className={styles.authSwitch}>
          Não tem conta? <Link href="/signup">Criar conta grátis</Link>
        </p>
      </div>
    </div>
  )
}
