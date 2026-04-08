export interface SeedService {
  name: string
  description: string
  unit: string
  unit_price: number
  category: string
  pricing_type: 'fixed' | 'per_km' | 'per_unit' | 'hourly' | 'per_area'
  base_price?: number
}

export const SEED_SERVICES: Record<string, SeedService[]> = {
  oficina: [
    { name: 'Troca de óleo', description: 'Troca de óleo do motor com filtro', unit: 'serviço', unit_price: 120.00, category: 'Manutenção', pricing_type: 'fixed' },
    { name: 'Alinhamento e Balanceamento', description: 'Alinhamento da direção e balanceamento das 4 rodas', unit: 'serviço', unit_price: 90.00, category: 'Manutenção', pricing_type: 'fixed' },
    { name: 'Troca de pastilha de freio', description: 'Troca das pastilhas dianteiras ou traseiras', unit: 'unidade', unit_price: 180.00, category: 'Freios', pricing_type: 'fixed' },
    { name: 'Revisão completa', description: 'Revisão geral com troca de filtros, velas e fluidos', unit: 'serviço', unit_price: 450.00, category: 'Revisão', pricing_type: 'fixed' },
    { name: 'Diagnóstico eletrônico', description: 'Scanner automotivo para identificação de falhas', unit: 'serviço', unit_price: 80.00, category: 'Diagnóstico', pricing_type: 'fixed' },
  ],
  construcao: [
    { name: 'Alvenaria', description: 'Levantamento de paredes em tijolo/bloco', unit: 'm²', unit_price: 95.00, category: 'Obra', pricing_type: 'per_area' },
    { name: 'Reboco', description: 'Aplicação de reboco em parede', unit: 'm²', unit_price: 45.00, category: 'Acabamento', pricing_type: 'per_area' },
    { name: 'Contrapiso', description: 'Preparo de contrapiso para revestimento', unit: 'm²', unit_price: 55.00, category: 'Piso', pricing_type: 'per_area' },
    { name: 'Assentamento de piso', description: 'Instalação de piso cerâmico ou porcelanato', unit: 'm²', unit_price: 70.00, category: 'Piso', pricing_type: 'per_area' },
    { name: 'Mão de obra diária', description: 'Diária de pedreiro', unit: 'diária', unit_price: 250.00, category: 'Mão de Obra', pricing_type: 'fixed' },
  ],
  eletrica: [
    { name: 'Ponto de tomada', description: 'Instalação de novo ponto de tomada', unit: 'unidade', unit_price: 120.00, category: 'Instalação', pricing_type: 'per_unit' },
    { name: 'Ponto de iluminação', description: 'Instalação de ponto de luz com interruptor', unit: 'unidade', unit_price: 130.00, category: 'Instalação', pricing_type: 'per_unit' },
    { name: 'Troca de disjuntor', description: 'Substituição de disjuntor no quadro', unit: 'unidade', unit_price: 80.00, category: 'Manutenção', pricing_type: 'per_unit' },
    { name: 'Instalação de chuveiro', description: 'Instalação elétrica de chuveiro com fiação dedicada', unit: 'serviço', unit_price: 200.00, category: 'Instalação', pricing_type: 'fixed' },
    { name: 'Visita técnica', description: 'Avaliação e diagnóstico de problemas elétricos', unit: 'serviço', unit_price: 100.00, category: 'Diagnóstico', pricing_type: 'fixed' },
  ],
  pintura: [
    { name: 'Pintura interna', description: 'Pintura de parede interna com tinta látex', unit: 'm²', unit_price: 25.00, category: 'Pintura interna', pricing_type: 'per_area' },
    { name: 'Pintura externa', description: 'Pintura de fachada/parede externa', unit: 'm²', unit_price: 35.00, category: 'Pintura externa', pricing_type: 'per_area' },
    { name: 'Massa corrida', description: 'Aplicação de massa corrida para nivelamento', unit: 'm²', unit_price: 20.00, category: 'Preparação', pricing_type: 'per_area' },
    { name: 'Texturização', description: 'Aplicação de textura decorativa', unit: 'm²', unit_price: 40.00, category: 'Acabamento', pricing_type: 'per_area' },
    { name: 'Pintura de portão', description: 'Pintura de portão metálico com esmalte', unit: 'serviço', unit_price: 350.00, category: 'Pintura especial', pricing_type: 'fixed' },
  ],
  encanamento: [
    { name: 'Desentupimento', description: 'Desentupimento de pia, ralo ou vaso sanitário', unit: 'serviço', unit_price: 150.00, category: 'Desentupimento', pricing_type: 'fixed' },
    { name: 'Troca de torneira', description: 'Instalação de nova torneira', unit: 'unidade', unit_price: 80.00, category: 'Instalação', pricing_type: 'per_unit' },
    { name: 'Reparo de vazamento', description: 'Localização e reparo de vazamento em cano', unit: 'serviço', unit_price: 200.00, category: 'Reparo', pricing_type: 'fixed' },
    { name: 'Instalação de caixa d\'água', description: 'Instalação e ligação de caixa d\'água', unit: 'serviço', unit_price: 400.00, category: 'Instalação', pricing_type: 'fixed' },
    { name: 'Troca de sifão', description: 'Substituição de sifão de pia ou lavatório', unit: 'unidade', unit_price: 60.00, category: 'Reparo', pricing_type: 'per_unit' },
  ],
  jardinagem: [
    { name: 'Corte de grama', description: 'Corte e limpeza de gramado', unit: 'm²', unit_price: 5.00, category: 'Manutenção', pricing_type: 'per_area' },
    { name: 'Poda de árvore', description: 'Poda e limpeza de árvore de médio porte', unit: 'unidade', unit_price: 200.00, category: 'Poda', pricing_type: 'per_unit' },
    { name: 'Plantio de mudas', description: 'Plantio de mudas com preparo do solo', unit: 'unidade', unit_price: 30.00, category: 'Plantio', pricing_type: 'per_unit' },
    { name: 'Manutenção mensal', description: 'Visita mensal com corte, poda e limpeza', unit: 'serviço', unit_price: 350.00, category: 'Manutenção', pricing_type: 'fixed' },
    { name: 'Limpeza de terreno', description: 'Capina e limpeza de terreno abandonado', unit: 'm²', unit_price: 8.00, category: 'Limpeza', pricing_type: 'per_area' },
  ],
  limpeza: [
    { name: 'Limpeza residencial', description: 'Limpeza completa de residência', unit: 'diária', unit_price: 200.00, category: 'Residencial', pricing_type: 'fixed' },
    { name: 'Limpeza comercial', description: 'Limpeza de escritório ou loja', unit: 'diária', unit_price: 300.00, category: 'Comercial', pricing_type: 'fixed' },
    { name: 'Limpeza pós-obra', description: 'Limpeza pesada após reforma ou construção', unit: 'm²', unit_price: 15.00, category: 'Pós-obra', pricing_type: 'per_area' },
    { name: 'Limpeza de vidros', description: 'Limpeza de vidraças e janelas', unit: 'm²', unit_price: 12.00, category: 'Especializada', pricing_type: 'per_area' },
    { name: 'Higienização de estofados', description: 'Lavagem e higienização de sofá ou colchão', unit: 'unidade', unit_price: 150.00, category: 'Especializada', pricing_type: 'per_unit' },
  ],
  tecnologia: [
    { name: 'Formatação de computador', description: 'Formatação com instalação do sistema operacional', unit: 'serviço', unit_price: 150.00, category: 'Manutenção', pricing_type: 'fixed' },
    { name: 'Consultoria de TI', description: 'Consultoria técnica para empresas', unit: 'hora', unit_price: 120.00, category: 'Consultoria', pricing_type: 'hourly' },
    { name: 'Criação de site', description: 'Desenvolvimento de site institucional', unit: 'serviço', unit_price: 2500.00, category: 'Desenvolvimento', pricing_type: 'fixed' },
    { name: 'Manutenção de rede', description: 'Configuração e manutenção de rede local', unit: 'hora', unit_price: 100.00, category: 'Infraestrutura', pricing_type: 'hourly' },
    { name: 'Suporte técnico remoto', description: 'Atendimento remoto para resolução de problemas', unit: 'hora', unit_price: 80.00, category: 'Suporte', pricing_type: 'hourly' },
  ],
}
