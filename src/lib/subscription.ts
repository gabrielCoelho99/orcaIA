import { createClient } from '@/lib/supabase/client'
import type { Subscription } from '@/lib/types'

export async function getSubscription(companyId: string): Promise<Subscription | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('company_id', companyId)
    .single()
  return data as Subscription | null
}

export async function canCreateQuote(companyId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const sub = await getSubscription(companyId)
  if (!sub) return { allowed: true, used: 0, limit: 5 }

  // Check if period has expired and needs reset
  if (new Date(sub.current_period_end) < new Date()) {
    const supabase = createClient()
    await supabase.from('subscriptions').update({
      quotes_used_this_month: 0,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }).eq('id', sub.id)
    return { allowed: true, used: 0, limit: sub.quotes_limit }
  }

  return {
    allowed: sub.quotes_used_this_month < sub.quotes_limit,
    used: sub.quotes_used_this_month,
    limit: sub.quotes_limit,
  }
}

export async function canCreateService(companyId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const supabase = createClient()
  const sub = await getSubscription(companyId)
  if (!sub) return { allowed: true, used: 0, limit: 3 }

  const { count } = await supabase
    .from('services')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('active', true)

  const used = count || 0
  return {
    allowed: used < sub.services_limit,
    used,
    limit: sub.services_limit,
  }
}

export async function incrementQuoteUsage(companyId: string): Promise<void> {
  const supabase = createClient()
  const sub = await getSubscription(companyId)
  if (!sub) return

  await supabase.from('subscriptions').update({
    quotes_used_this_month: sub.quotes_used_this_month + 1,
  }).eq('id', sub.id)
}
