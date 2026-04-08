import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

if (!process.env.GROQ_API_KEY) {
  console.error('⚠️ GROQ_API_KEY is not set!')
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

const MODELS = [
  'llama-3.3-70b-versatile',
  'llama3-70b-8192',
  'llama3-8b-8192',
]

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

async function getTemplateText(supabase: SupabaseClient, path: string) {
  try {
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('company_templates')
      .download(path)

    if (downloadError) {
      console.error('Error downloading template:', downloadError)
      return null
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())

    if (path.toLowerCase().endsWith('.pdf')) {
      try {
        const { createRequire } = await import('module')
        const require = createRequire(import.meta.url)
        const pdfParse = require('pdf-parse')
        const data = await pdfParse(buffer)
        return data.text
      } catch (e) {
        console.error('pdf-parse unavailable, skipping template:', e)
        return null
      }
    } else if (path.toLowerCase().endsWith('.docx')) {
      try {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer })
        return result.value
      } catch (e) {
        console.error('mammoth unavailable, skipping template:', e)
        return null
      }
    } else {
      return buffer.toString('utf-8')
    }
  } catch (err) {
    console.error('Error parsing template:', err)
    return null
  }
}

function buildSystemPrompt(companyName: string, businessType: string, services: ServiceData[], templateText?: string | null) {
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

  let prompt = `Você é o assistente de orçamentos da empresa "${companyName}" (${businessType}).
Seu trabalho é ajudar a criar orçamentos profissionais conversando com o usuário.

CATÁLOGO DE SERVIÇOS:
${serviceList || 'Nenhum serviço cadastrado ainda.'}`

  if (templateText) {
    prompt += `\n\nESTRUTURA OBRIGATÓRIA (MODELO DE REFERÊNCIA):
Este usuário faz orçamentos seguindo um padrão específico. Você DEVE extrair a estrutura, o tom de voz e os termos de fechamento do conteúdo abaixo e replicar no orçamento final:
---
${templateText}
---`
  }

  prompt += `\n\nREGRAS:
1. Sempre responda em português brasileiro, de forma profissional mas amigável.
2. Faça perguntas para entender o que o cliente precisa (nome do cliente, serviços, quantidades).
3. Use o catálogo de serviços da empresa para calcular valores.
4. Para serviços por km (entrega, frete, etc): pergunte a distância ou os pontos de partida/destino. Calcule: valor = preço_base + (km × preço_por_km).
5. Para serviços por m², m linear, hora, etc: pergunte as quantidades/dimensões necessárias.
6. OBRIGATÓRIO: Antes de gerar o orçamento, pergunte ao usuário:
   - As condições de pagamento (ex: "à vista", "50% entrada + 50% na entrega", "parcelado em 3x", etc.)
   - A validade do orçamento em dias (ex: 7, 15, 30 dias). Se não informar, use 30 dias como padrão.
7. Quando tiver TODAS as informações (cliente, serviços, quantidades, pagamento e validade), apresente o orçamento completo de acordo com o modelo de referência (se houver).
8. Sempre que apresentar o orçamento completo, inclua no final da mensagem um bloco JSON assim:

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
  "payment_terms": "Condições de pagamento informadas pelo usuário",
  "validity_days": 30,
  "notes": ""
}
\`\`\`

9. Se o usuário pedir ajustes (desconto, adicionar/remover item, mudar pagamento), faça e apresente novamente.
10. Nunca invente serviços que não estão no catálogo. Se o serviço não existir, informe e sugira cadastrar.
11. Seja proativo em sugerir serviços relacionados do catálogo.
12. Use as unidades corretas para cada serviço (km, m², hora, etc).`

  return prompt
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
      supabase.from('companies').select('name, business_type, quote_template_url').eq('id', profile.company_id).single(),
      supabase.from('services').select('*').eq('company_id', profile.company_id).eq('active', true),
    ])

    const templateText = company?.quote_template_url 
      ? await getTemplateText(supabase, company.quote_template_url)
      : null

    const { messages } = await req.json() as { messages: ChatMessage[] }

    const systemPrompt = buildSystemPrompt(
      company?.name || 'Empresa',
      company?.business_type || 'serviços',
      (services || []) as ServiceData[],
      templateText
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

    // Validate API key before making the call
    if (!process.env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Chave da IA não configurada. Verifique GROQ_API_KEY nas variáveis de ambiente.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Try models in fallback order
    let stream: AsyncIterable<Groq.Chat.Completions.ChatCompletionChunk> | null = null
    let lastError: Error | null = null

    for (const model of MODELS) {
      try {
        stream = await groq.chat.completions.create({
          model,
          messages: groqMessages,
          temperature: 0.7,
          max_tokens: 2048,
          stream: true,
        })
        break // success
      } catch (modelError) {
        console.error(`Model ${model} failed:`, modelError)
        lastError = modelError instanceof Error ? modelError : new Error(String(modelError))
        continue // try next model
      }
    }

    if (!stream) {
      const errMsg = lastError?.message || 'Nenhum modelo disponível'
      return new Response(
        JSON.stringify({ error: `IA indisponível: ${errMsg}` }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream!) {
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
      console.error('Error details:', msg)

      if (msg.includes('429') || msg.toLowerCase().includes('rate')) {
        userMessage = 'A IA está sobrecarregada no momento. Aguarde alguns segundos e tente novamente.'
        status = 429
      } else if (msg.includes('401') || msg.includes('api_key') || msg.includes('authentication')) {
        userMessage = 'Erro de autenticação com a IA. A API key pode estar inválida ou expirada.'
        status = 500
      } else if (msg.includes('model') || msg.includes('not found')) {
        userMessage = 'Modelo de IA indisponível. Tente novamente em instantes.'
        status = 503
      } else {
        // Include actual error for debugging in production
        userMessage = `Erro na IA: ${msg.substring(0, 150)}`
      }
    }

    return new Response(
      JSON.stringify({ error: userMessage }),
      { status, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
