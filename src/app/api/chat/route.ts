import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

interface ServiceData {
  name: string
  unit_price: number
  unit: string
  description?: string | null
  pricing_type?: string
  base_price?: number
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

function buildSystemPrompt(companyName: string, businessType: string, services: ServiceData[]) {
  const serviceList = services
    .map(s => {
      let priceInfo = `R$ ${Number(s.unit_price).toFixed(2)} por ${s.unit}`
      if (s.pricing_type === 'per_km') {
        priceInfo = `R$ ${Number(s.unit_price).toFixed(2)} por km (base: R$ ${Number(s.base_price || 0).toFixed(2)})`
      } else if (s.pricing_type === 'per_area') {
        priceInfo = `R$ ${Number(s.unit_price).toFixed(2)} por m²`
      } else if (s.pricing_type === 'hourly') {
        priceInfo = `R$ ${Number(s.unit_price).toFixed(2)} por hora`
      }
      return `- ${s.name}: ${priceInfo}${s.description ? ` — ${s.description}` : ''}`
    })
    .join('\n')

  return `Você é o assistente de orçamentos da empresa "${companyName}" (${businessType}).
Seu trabalho é ajudar a criar orçamentos profissionais conversando com o usuário.

CATÁLOGO DE SERVIÇOS:
${serviceList || 'Nenhum serviço cadastrado ainda.'}

REGRAS:
1. Sempre responda em português brasileiro, de forma profissional mas amigável.
2. Faça perguntas para entender o que o cliente precisa (nome do cliente, serviços, quantidades).
3. Use o catálogo de serviços da empresa para calcular valores.
4. Para serviços por km (entrega, frete, etc): pergunte a distância ou os pontos de partida/destino. Calcule: valor = preço_base + (km × preço_por_km).
5. Para serviços por m², m linear, hora, etc: pergunte as quantidades/dimensões necessárias.
6. Quando tiver informações suficientes, apresente uma tabela resumo do orçamento.
7. Sempre que apresentar o orçamento completo, inclua no final da mensagem um bloco JSON assim:

\`\`\`json
{
  "quote_ready": true,
  "client_name": "Nome do Cliente",
  "client_phone": "",
  "client_email": "",
  "items": [
    {
      "description": "Descrição do serviço",
      "quantity": 1,
      "unit": "unidade",
      "unit_price": 100.00,
      "total": 100.00
    }
  ],
  "subtotal": 100.00,
  "discount": 0,
  "total": 100.00,
  "payment_terms": "À vista ou condições a combinar",
  "notes": ""
}
\`\`\`

8. Se o usuário pedir ajustes (desconto, adicionar/remover item), faça e apresente novamente.
9. Nunca invente serviços que não estão no catálogo. Se o serviço não existir, informe e sugira cadastrar.
10. Seja proativo em sugerir serviços relacionados do catálogo.
11. Use as unidades corretas para cada serviço (km, m², hora, etc).`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return new Response('No company', { status: 400 })
    }

    const [{ data: company }, { data: services }] = await Promise.all([
      supabase.from('companies').select('name, business_type').eq('id', profile.company_id).single(),
      supabase.from('services').select('*').eq('company_id', profile.company_id).eq('active', true),
    ])

    const { messages } = await req.json() as { messages: ChatMessage[] }

    const systemPrompt = buildSystemPrompt(
      company?.name || 'Empresa',
      company?.business_type || 'serviços',
      (services || []) as ServiceData[]
    )

    // Build Groq messages: system + conversation history
    // Filter out the initial greeting (first assistant message added by frontend)
    const chatMessages = messages.filter(m => m.content && m.content.trim())

    const groqMessages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ]

    // Add conversation history, skipping the initial bot greeting
    let skippedFirstAssistant = false
    for (const msg of chatMessages) {
      if (!skippedFirstAssistant && msg.role === 'assistant') {
        skippedFirstAssistant = true
        continue
      }
      groqMessages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })
    }

    // If no user message was added, something is wrong
    if (!groqMessages.some(m => m.role === 'user')) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma mensagem enviada.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: groqMessages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ''
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (streamError) {
          console.error('Stream error:', streamError)
          const errorMsg = streamError instanceof Error ? streamError.message : 'Erro na geração'
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)

    let userMessage = 'Erro ao se comunicar com a IA. Tente novamente.'
    let status = 500

    if (error instanceof Error) {
      const msg = error.message
      if (msg.includes('429') || msg.toLowerCase().includes('rate')) {
        userMessage = 'A IA está sobrecarregada no momento. Aguarde alguns segundos e tente novamente.'
        status = 429
      } else if (msg.includes('401') || msg.includes('api_key')) {
        userMessage = 'Erro de autenticação com a IA. Verifique a API key.'
        status = 500
      }
    }

    return new Response(
      JSON.stringify({ error: userMessage }),
      { status, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
