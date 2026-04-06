export interface Company {
  id: string
  name: string
  business_type: string
  phone: string | null
  email: string | null
  address: string | null
  cnpj: string | null
  logo_url: string | null
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  email: string
  company_id: string | null
  role: 'owner' | 'admin' | 'member'
  created_at: string
}

export interface Service {
  id: string
  company_id: string
  name: string
  description: string | null
  unit_price: number
  unit: string
  pricing_type: 'fixed' | 'per_km' | 'per_unit' | 'hourly' | 'per_area'
  base_price: number
  category: string | null
  active: boolean
  created_at: string
}

export interface Quote {
  id: string
  company_id: string
  created_by: string
  client_name: string
  client_email: string | null
  client_phone: string | null
  status: 'draft' | 'sent' | 'approved' | 'rejected'
  subtotal: number
  discount: number
  total: number
  payment_terms: string | null
  validity_days: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface QuoteItem {
  id: string
  quote_id: string
  service_id: string | null
  description: string
  quantity: number
  unit: string
  unit_price: number
  total: number
  sort_order: number
}

export interface ChatMessage {
  id: string
  quote_id: string
  company_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface Subscription {
  id: string
  company_id: string
  plan: 'free' | 'pro'
  status: 'active' | 'canceled' | 'past_due'
  quotes_limit: number
  services_limit: number
  quotes_used_this_month: number
  current_period_start: string
  current_period_end: string
  created_at: string
  updated_at: string
}

export const PLAN_DETAILS = {
  free: {
    name: 'Grátis',
    price: 0,
    quotes_limit: 5,
    services_limit: 3,
    features: [
      '5 orçamentos por mês',
      '3 serviços cadastrados',
      'Chat com IA',
      'PDF básico',
    ],
  },
  pro: {
    name: 'Profissional',
    price: 49.90,
    quotes_limit: 999999,
    services_limit: 999999,
    features: [
      'Orçamentos ilimitados',
      'Serviços ilimitados',
      'Chat com IA avançado',
      'PDF com logo personalizada',
      'Relatórios (em breve)',
      'Suporte prioritário',
    ],
  },
} as const
