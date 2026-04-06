'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'
import styles from './chat.module.css'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type QuoteData = {
  quote_ready: boolean
  client_name: string
  client_phone: string
  client_email: string
  items: Array<{
    description: string
    quantity: number
    unit: string
    unit_price: number
    total: number
  }>
  subtotal: number
  discount: number
  total: number
  payment_terms: string
  validity_days: number
  notes: string
}

function extractQuoteData(text: string): QuoteData | null {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/)
  if (!jsonMatch) return null
  try {
    const data = JSON.parse(jsonMatch[1])
    if (data.quote_ready) return data
  } catch { /* ignore */ }
  return null
}

function formatMessage(content: string): string {
  return content.replace(/```json[\s\S]*?```/g, '').trim()
}

export default function NewQuotePage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! 👋 Vou ajudar você a criar um orçamento. Para quem será este orçamento? Me diga o nome do cliente e o que ele precisa.' },
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null)
  const [savingQuote, setSavingQuote] = useState(false)
  const [quotaReached, setQuotaReached] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const checkQuota = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
      if (profile?.company_id) {
        const { canCreateQuote } = await import('@/lib/subscription')
        const { allowed } = await canCreateQuote(profile.company_id)
        if (!allowed) {
          setQuotaReached(true)
          setMessages([{ role: 'assistant', content: '❌ Você atingiu o limite de orçamentos do seu plano neste mês. Faça o upgrade para o plano Profissional em Configurações para criar orçamentos ilimitados.' }])
        }
      }
    }
    checkQuota()
  }, [])

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsStreaming(true)

    const allMessages = [
      ...messages,
      { role: 'user' as const, content: userMessage },
    ]

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages }),
      })

      if (!res.ok) {
        let errorMsg = 'Erro na API'
        try {
          const errorData = await res.json()
          errorMsg = errorData.error || errorMsg
        } catch { /* response might not be JSON */ }
        throw new Error(errorMsg)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No reader')

      const decoder = new TextDecoder()
      let assistantContent = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.text) {
              assistantContent += parsed.text
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent }
                return updated
              })
            }
          } catch { /* ignore */ }
        }
      }

      const extracted = extractQuoteData(assistantContent)
      if (extracted) setQuoteData(extracted)
    } catch (error) {
      let errorMessage = '❌ Desculpe, ocorreu um erro. Tente novamente.'
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('sobrecarregada')) {
          errorMessage = '⏳ A IA está sobrecarregada. Aguarde alguns segundos e tente novamente.'
        }
      }
      setMessages(prev => {
        // Remove empty assistant message if it was added
        const filtered = prev.filter(m => m.content !== '')
        return [...filtered, { role: 'assistant', content: errorMessage }]
      })
    } finally {
      setIsStreaming(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSaveQuote = async () => {
    if (!quoteData) return
    setSavingQuote(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user!.id)
      .single()

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        company_id: profile!.company_id,
        created_by: user!.id,
        client_name: quoteData.client_name,
        client_phone: quoteData.client_phone || null,
        client_email: quoteData.client_email || null,
        subtotal: quoteData.subtotal,
        discount: quoteData.discount,
        total: quoteData.total,
        status: 'draft',
        payment_terms: quoteData.payment_terms || null,
        validity_days: quoteData.validity_days || 30,
        notes: quoteData.notes || null,
      })
      .select()
      .single()

    if (quoteError || !quote) {
      toast.error('Erro ao salvar orçamento.')
      setSavingQuote(false)
      return
    }

    if (quoteData.items.length > 0) {
      await supabase.from('quote_items').insert(
        quoteData.items.map((item, index) => ({
          quote_id: quote.id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total: item.total,
          sort_order: index,
        }))
      )
    }

    // Save chat messages
    const chatMessages = messages.map(m => ({
      quote_id: quote.id,
      company_id: profile!.company_id,
      role: m.role,
      content: m.content,
    }))
    await supabase.from('chat_messages').insert(chatMessages)

    // Increment quota usage
    const { incrementQuoteUsage } = await import('@/lib/subscription')
    await incrementQuoteUsage(profile!.company_id)

    router.push(`/dashboard/quotes/${quote.id}`)
  }

  return (
    <div className={styles.chatPage}>
      <div className={styles.chatHeader}>
        <h1>Novo Orçamento</h1>
        <p>Converse com a IA para criar seu orçamento</p>
      </div>

      <div className={styles.chatMessages}>
        {messages.map((msg, i) => (
          <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
            <div className={styles.messageAvatar}>
              {msg.role === 'assistant' ? '🐋' : '👤'}
            </div>
            <div className={styles.messageBubble}>
              <div className={styles.messageContent}>{formatMessage(msg.content)}</div>
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className={styles.typingIndicator}>
            <span /><span /><span />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {quoteData && (
        <div className={styles.quoteAction}>
          <div className={styles.quoteActionContent}>
            <span>✅ Orçamento pronto para <strong>{quoteData.client_name}</strong> — <strong>R$ {quoteData.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
            <button className="btn btn-accent" onClick={handleSaveQuote} disabled={savingQuote}>
              {savingQuote ? <span className="spinner" /> : 'Salvar e Visualizar'}
            </button>
          </div>
        </div>
      )}

      <div className={styles.chatInput}>
        <textarea
          ref={inputRef}
          className={styles.textarea}
          placeholder={quotaReached ? "Limite de orçamentos atingido." : "Descreva o serviço para o orçamento..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isStreaming || quotaReached}
        />
        <button
          className={`btn btn-accent btn-icon ${styles.sendBtn}`}
          onClick={handleSend}
          disabled={!input.trim() || isStreaming || quotaReached}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
