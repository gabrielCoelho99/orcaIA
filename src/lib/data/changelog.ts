export interface ChangelogFeature {
  text: string
  tag: 'novo' | 'correção' | 'melhoria'
}

export interface ChangelogItem {
  version: string
  date: string
  title: string
  description: string
  features: ChangelogFeature[]
}

export const CHANGELOG: ChangelogItem[] = [
  {
    version: '1.3.0',
    date: '2026-04-07',
    title: 'Construtor de Orçamentos em Blocos',
    description: 'Crie orçamentos personalizados arrastando blocos visuais. Modele o layout do seu PDF do zero ou escolha um template pronto para o seu segmento.',
    features: [
      { text: 'Editor visual drag-and-drop com 11 tipos de blocos: Cabeçalho, Contato & Redes Sociais, Dados do Cliente, Tabela de Itens, Galeria de Fotos, Texto Livre, Totais, Condições de Pagamento, Assinatura, Divisor e Rodapé.', tag: 'novo' },
      { text: '5 templates prontos por segmento: Padrão, Oficina/Automotivo, Construção Civil, Tecnologia/TI e Serviços Profissionais.', tag: 'novo' },
      { text: 'Tema personalizável: cor primária, cor secundária e fonte do PDF. Todas as configurações são refletidas em tempo real no preview.', tag: 'novo' },
      { text: 'Geração de PDF dinâmica: o orçamento é gerado automaticamente com o layout em blocos definido pela empresa.', tag: 'novo' },
      { text: 'Campos de redes sociais na empresa: Instagram, Facebook, WhatsApp e Website — exibidos automaticamente no bloco de contato do orçamento.', tag: 'novo' },
      { text: 'Correção na troca de empresas no plano Agência: a subscription agora é criada corretamente para novas empresas.', tag: 'correção' },
      { text: 'Correção nas permissões de segurança (RLS): owners do plano Agência agora podem editar e gerenciar todas as suas empresas.', tag: 'correção' },
      { text: 'Tratamento de erros ao criar empresa: se a subscription falhar, a empresa é removida e o erro é exibido.', tag: 'melhoria' },
    ]
  },
  {
    version: '1.2.0',
    date: '2026-04-06',
    title: 'Monetização e Multi-Empresas',
    description: 'Nesta atualização trouxemos o plano para contadores e melhorias de usabilidade no sistema!',
    features: [
      { text: 'Novo plano Agência com suporte a até 5 empresas.', tag: 'novo' },
      { text: 'Possibilidade de fazer Upload da sua própria Logo.', tag: 'novo' },
      { text: 'Possibilidade de subir seu próprio arquivo de Modelo de Orçamento (PDF/Doc).', tag: 'novo' },
      { text: 'Correção no layout dos modais para caber em telas menores.', tag: 'correção' },
    ]
  },
  {
    version: '1.1.0',
    date: '2026-04-04',
    title: 'Automações de Pagamento',
    description: 'Integramos nossa verificação de pagamentos automaticamente com o Mercado Pago.',
    features: [
      { text: 'Upgrade do plano Free para Pro instantâneo.', tag: 'novo' },
      { text: 'Melhoria nas permissões de base de dados.', tag: 'melhoria' },
    ]
  },
]
