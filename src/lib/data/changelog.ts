export interface ChangelogItem {
  version: string
  date: string
  title: string
  description: string
  features: string[]
}

export const CHANGELOG: ChangelogItem[] = [
  {
    version: '1.2.0',
    date: '2026-04-06',
    title: 'Monetização e Multi-Empresas',
    description: 'Nesta atualização trouxemos o plano para contadores e melhorias de usabilidade no sistema!',
    features: [
      'Novo plano Agência com suporte a até 5 empresas.',
      'Possibilidade de fazer Upload da sua própria Logo.',
      'Possibilidade de subir seu próprio arquivo de Modelo de Orçamento (PDF/Doc).',
      'Correção no layout dos modais para caber em telas menores.'
    ]
  },
  {
    version: '1.1.0',
    date: '2026-04-04',
    title: 'Automações de Pagamento',
    description: 'Integramos nossa verificação de pagamentos automaticamente com o Mercado Pago.',
    features: [
      'Upgrade do plano Free para Pro instantâneo.',
      'Melhoria nas permissões de base de dados.'
    ]
  },
]
