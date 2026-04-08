export interface Company {
  id: string
  name: string
  business_type: string
  phone: string | null
  email: string | null
  address: string | null
  cnpj: string | null
  logo_url: string | null
  quote_template_url: string | null
  owner_id: string | null
  instagram: string | null
  facebook: string | null
  whatsapp: string | null
  website: string | null
  quote_layout: QuoteLayout | null
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
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
  plan: 'free' | 'pro' | 'agency'
  status: 'active' | 'canceled' | 'past_due'
  quotes_limit: number
  services_limit: number
  quotes_used_this_month: number
  current_period_start: string
  current_period_end: string
  created_at: string
  updated_at: string
}

// Quote Builder Types
export type BlockType = 'header' | 'contact' | 'client' | 'items_table' | 'photos' | 'free_text' | 'totals' | 'payment_terms' | 'signature' | 'divider' | 'footer'

export interface QuoteBlockBase {
  id: string
  type: BlockType
}

export interface HeaderBlockConfig { showLogo: boolean; bgColor: string; alignment: 'left' | 'center' }
export interface ContactBlockConfig { fields: ('phone' | 'email' | 'address' | 'instagram' | 'facebook' | 'whatsapp' | 'website')[]; layout: 'inline' | 'stacked' }
export interface ClientBlockConfig { fields: ('name' | 'phone' | 'email')[]; layout: 'horizontal' | 'vertical' }
export interface ItemsTableBlockConfig { columns: ('description' | 'qty' | 'unit' | 'price' | 'total')[]; zebraColor: string }
export interface PhotosBlockConfig { maxPhotos: number; layout: 'grid' | 'row'; showCaptions: boolean }
export interface FreeTextBlockConfig { content: string; bold: boolean; color: string }
export interface TotalsBlockConfig { showSubtotal: boolean; showDiscount: boolean; position: 'right' | 'center' }
export interface PaymentTermsBlockConfig { layout: 'paragraph' | 'list' }
export interface SignatureBlockConfig { columns: 1 | 2; labels: string[] }
export interface DividerBlockConfig { style: 'solid' | 'dashed' | 'dotted'; color: string; thickness: number }
export interface FooterBlockConfig { text: string; showBranding: boolean }

export type QuoteBlock =
  | (QuoteBlockBase & { type: 'header'; config: HeaderBlockConfig })
  | (QuoteBlockBase & { type: 'contact'; config: ContactBlockConfig })
  | (QuoteBlockBase & { type: 'client'; config: ClientBlockConfig })
  | (QuoteBlockBase & { type: 'items_table'; config: ItemsTableBlockConfig })
  | (QuoteBlockBase & { type: 'photos'; config: PhotosBlockConfig })
  | (QuoteBlockBase & { type: 'free_text'; config: FreeTextBlockConfig })
  | (QuoteBlockBase & { type: 'totals'; config: TotalsBlockConfig })
  | (QuoteBlockBase & { type: 'payment_terms'; config: PaymentTermsBlockConfig })
  | (QuoteBlockBase & { type: 'signature'; config: SignatureBlockConfig })
  | (QuoteBlockBase & { type: 'divider'; config: DividerBlockConfig })
  | (QuoteBlockBase & { type: 'footer'; config: FooterBlockConfig })

export interface QuoteLayout {
  version: 1
  theme: {
    primaryColor: string
    secondaryColor: string
    fontFamily: 'helvetica' | 'times' | 'courier'
  }
  blocks: QuoteBlock[]
}

export const BLOCK_META: Record<BlockType, { label: string; icon: string; description: string }> = {
  header: { label: 'Cabeçalho', icon: '🏷️', description: 'Logo e nome da empresa' },
  contact: { label: 'Contato & Redes', icon: '📱', description: 'Telefone, e-mail, redes sociais' },
  client: { label: 'Dados do Cliente', icon: '👤', description: 'Nome, telefone e e-mail do cliente' },
  items_table: { label: 'Tabela de Itens', icon: '📋', description: 'Serviços, quantidades e valores' },
  photos: { label: 'Galeria de Fotos', icon: '📸', description: 'Fotos do serviço (até 4)' },
  free_text: { label: 'Texto Livre', icon: '📝', description: 'Parágrafo customizável' },
  totals: { label: 'Totais', icon: '💰', description: 'Subtotal, desconto e total' },
  payment_terms: { label: 'Condições de Pagamento', icon: '💳', description: 'Formas de pagamento' },
  signature: { label: 'Assinatura', icon: '✍️', description: 'Linhas de assinatura' },
  divider: { label: 'Divisor', icon: '➖', description: 'Linha decorativa' },
  footer: { label: 'Rodapé', icon: '📄', description: 'Texto final e branding' },
}

function makeId() { return `blk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }

export function createDefaultBlock(type: BlockType): QuoteBlock {
  const id = makeId()
  switch (type) {
    case 'header': return { id, type, config: { showLogo: true, bgColor: '#0A66C2', alignment: 'left' } }
    case 'contact': return { id, type, config: { fields: ['phone', 'email', 'address'], layout: 'inline' } }
    case 'client': return { id, type, config: { fields: ['name', 'phone', 'email'], layout: 'horizontal' } }
    case 'items_table': return { id, type, config: { columns: ['description', 'qty', 'unit', 'price', 'total'], zebraColor: '#F5F7FA' } }
    case 'photos': return { id, type, config: { maxPhotos: 4, layout: 'grid', showCaptions: true } }
    case 'free_text': return { id, type, config: { content: '', bold: false, color: '#0F1419' } }
    case 'totals': return { id, type, config: { showSubtotal: true, showDiscount: true, position: 'right' } }
    case 'payment_terms': return { id, type, config: { layout: 'paragraph' } }
    case 'signature': return { id, type, config: { columns: 2, labels: ['Contratante', 'Contratado'] } }
    case 'divider': return { id, type, config: { style: 'solid', color: '#E2E8F0', thickness: 1 } }
    case 'footer': return { id, type, config: { text: '', showBranding: true } }
  }
}

const defaultTheme = { primaryColor: '#0A66C2', secondaryColor: '#00D4AA', fontFamily: 'helvetica' as const }

export const DEFAULT_TEMPLATES: Record<string, { name: string; description: string; layout: QuoteLayout }> = {
  padrao: {
    name: 'Padrão',
    description: 'Modelo limpo e direto para qualquer negócio',
    layout: {
      version: 1, theme: defaultTheme,
      blocks: [
        createDefaultBlock('header'), createDefaultBlock('client'),
        createDefaultBlock('items_table'), createDefaultBlock('totals'),
        createDefaultBlock('payment_terms'), createDefaultBlock('footer'),
      ],
    },
  },
  oficina: {
    name: 'Oficina / Automotivo',
    description: 'Inclui fotos e assinatura para serviços automotivos',
    layout: {
      version: 1, theme: { ...defaultTheme, primaryColor: '#1E3A5F' },
      blocks: [
        createDefaultBlock('header'), createDefaultBlock('contact'), createDefaultBlock('client'),
        createDefaultBlock('photos'), createDefaultBlock('items_table'), createDefaultBlock('totals'),
        createDefaultBlock('payment_terms'), createDefaultBlock('signature'), createDefaultBlock('footer'),
      ],
    },
  },
  construcao: {
    name: 'Construção Civil',
    description: 'Com escopo detalhado e garantia para obras',
    layout: {
      version: 1, theme: { ...defaultTheme, primaryColor: '#D97706' },
      blocks: [
        createDefaultBlock('header'), createDefaultBlock('client'),
        { ...createDefaultBlock('free_text'), config: { content: 'ESCOPO DO SERVIÇO:\n\nDescreva aqui o escopo detalhado da obra...', bold: false, color: '#0F1419' } } as QuoteBlock,
        createDefaultBlock('items_table'), createDefaultBlock('totals'), createDefaultBlock('payment_terms'),
        { ...createDefaultBlock('free_text'), config: { content: 'GARANTIA: 5 anos para vícios construtivos conforme Art. 618 do Código Civil.', bold: true, color: '#0F1419' } } as QuoteBlock,
        createDefaultBlock('signature'), createDefaultBlock('footer'),
      ],
    },
  },
  tecnologia: {
    name: 'Tecnologia / TI',
    description: 'Com contato e SLA para projetos de software',
    layout: {
      version: 1, theme: { ...defaultTheme, primaryColor: '#7C3AED' },
      blocks: [
        createDefaultBlock('header'), createDefaultBlock('contact'), createDefaultBlock('client'),
        createDefaultBlock('items_table'), createDefaultBlock('totals'),
        { ...createDefaultBlock('free_text'), config: { content: 'SLA: Suporte em até 24h úteis. Manutenção corretiva inclusa por 90 dias.', bold: false, color: '#0F1419' } } as QuoteBlock,
        createDefaultBlock('payment_terms'), createDefaultBlock('footer'),
      ],
    },
  },
  profissional: {
    name: 'Serviços Profissionais',
    description: 'Completo com termos e assinatura para prestadores',
    layout: {
      version: 1, theme: { ...defaultTheme, primaryColor: '#059669' },
      blocks: [
        createDefaultBlock('header'), createDefaultBlock('contact'), createDefaultBlock('client'),
        createDefaultBlock('items_table'), createDefaultBlock('totals'), createDefaultBlock('payment_terms'),
        { ...createDefaultBlock('free_text'), config: { content: 'TERMOS: Este orçamento é válido conforme as condições aqui descritas. Alterações de escopo podem gerar custos adicionais.', bold: false, color: '#0F1419' } } as QuoteBlock,
        createDefaultBlock('signature'), createDefaultBlock('divider'), createDefaultBlock('footer'),
      ],
    },
  },
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
    promoPrice: 34.99,
    promoMonths: 3,
    promoLabel: '3 primeiros meses',
    quotes_limit: 999999,
    services_limit: 999999,
    features: [
      'Orçamentos ilimitados',
      'Serviços ilimitados',
      'Chat com IA avançado',
      'PDF com logo personalizada',
      'Construtor de Orçamentos em Blocos',
      'Suporte prioritário',
    ],
  },
  agency: {
    name: 'Agência / Contador',
    price: 149.90,
    quotes_limit: 999999,
    services_limit: 999999,
    features: [
      'Até 5 empresas / clientes',
      'Orçamentos ilimitados',
      'Construtor de Orçamentos em Blocos',
      'Suporte Premium Dedicado',
    ],
  },
} as const
