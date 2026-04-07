'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import styles from '../login/auth.module.css'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (signupError) {
      if (signupError.message.includes('already registered')) {
        setError('Este email já está cadastrado. Tente fazer login.')
      } else {
        setError(signupError.message)
      }
      setLoading(false)
      return
    }

    setEmailSent(true)
    setLoading(false)
  }

  if (emailSent) {
    return (
      <div className={styles.authPage}>
        <div className={styles.authGlow} />
        <div className={styles.authCard}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(0, 212, 170, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '1.75rem',
            }}>
              ✉️
            </div>
            <h1 style={{ marginBottom: '0.75rem' }}>Verifique seu email</h1>
            <p className={styles.authSubtext} style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
              Enviamos um link de confirmação para<br />
              <strong style={{ color: 'var(--accent-primary)' }}>{email}</strong>
            </p>

            <div style={{
              background: 'rgba(0, 212, 170, 0.06)',
              border: '1px solid rgba(0, 212, 170, 0.15)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              textAlign: 'left',
            }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.7', margin: 0 }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>📋 Próximos passos:</strong>
                1. Abra sua caixa de entrada (ou spam)<br />
                2. Clique no link de confirmação<br />
                3. Faça login e configure sua empresa
              </p>
            </div>

            <Link 
              href="/login" 
              className="btn btn-accent btn-lg" 
              style={{ width: '100%', display: 'inline-flex', justifyContent: 'center', textDecoration: 'none' }}
            >
              Ir para o Login
            </Link>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '1rem' }}>
              Não recebeu? Verifique a pasta de spam ou tente novamente.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authGlow} />
      <div className={styles.authCard}>
        <Link href="/" className={styles.authLogo}>
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" stroke="url(#gradS)" strokeWidth="2" fill="none"/>
            <path d="M10 18C10 14 13 10 16 10C19 10 22 14 22 18C22 22 19 24 16 24C13 24 10 22 10 18Z" fill="url(#gradS)"/>
            <circle cx="14" cy="16" r="1.5" fill="#0F1419"/>
            <defs><linearGradient id="gradS" x1="0" y1="0" x2="32" y2="32"><stop offset="0%" stopColor="#00D4AA"/><stop offset="100%" stopColor="#0A66C2"/></linearGradient></defs>
          </svg>
          <span>OrcaIA</span>
        </Link>
        <h1>Criar sua conta</h1>
        <p className={styles.authSubtext}>Comece a gerar orçamentos em minutos.</p>

        <form onSubmit={handleSignup} className={styles.authForm}>
          <div className="input-group">
            <label htmlFor="fullName">Nome completo</label>
            <input
              id="fullName"
              type="text"
              className="input"
              placeholder="Seu nome"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
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
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <div className={styles.authError}>{error}</div>}

          <button type="submit" className="btn btn-accent btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Criar conta'}
          </button>
        </form>

        <p className={styles.authSwitch}>
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
