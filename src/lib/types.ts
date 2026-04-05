export interface Company {
  id: string
  name: string
  business_type: string
  phone: string | null
  email: string | null
  address: string | null
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
