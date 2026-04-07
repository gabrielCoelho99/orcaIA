import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { QuoteLayout, QuoteBlock, Company, Quote, QuoteItem } from './types'

interface PDFContext {
  doc: jsPDF
  y: number
  layout: QuoteLayout
  company: Company
  quote: Quote
  items: QuoteItem[]
  logoUrl?: string | null
}

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '')
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]
}

function fmt(n: number) { return n.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }

function renderHeader(ctx: PDFContext, block: Extract<QuoteBlock, { type: 'header' }>, logoImage?: string | null): number {
  const { doc } = ctx
  const [r, g, b] = hexToRgb(block.config.bgColor)
  doc.setFillColor(r, g, b)
  doc.rect(0, ctx.y, 210, 22, 'F')

  let x = block.config.alignment === 'center' ? 105 : 15

  if (block.config.showLogo && logoImage) {
    try {
      const logoX = block.config.alignment === 'center' ? 85 : 15
      doc.addImage(logoImage, 'JPEG', logoX, ctx.y + 3, 16, 16)
      x = block.config.alignment === 'center' ? 105 : 35
    } catch { /* skip logo */ }
  }

  doc.setFont(ctx.layout.theme.fontFamily, 'bold')
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  const align = block.config.alignment === 'center' ? 'center' : 'left'
  doc.text(ctx.company.name, x, ctx.y + 14, { align })

  return ctx.y + 28
}

function renderContact(ctx: PDFContext, block: Extract<QuoteBlock, { type: 'contact' }>): number {
  const { doc, company } = ctx
  doc.setFont(ctx.layout.theme.fontFamily, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)

  const parts: string[] = []
  if (block.config.fields.includes('phone') && company.phone) parts.push(`📞 ${company.phone}`)
  if (block.config.fields.includes('email') && company.email) parts.push(`✉️ ${company.email}`)
  if (block.config.fields.includes('address') && company.address) parts.push(`📍 ${company.address}`)
  if (block.config.fields.includes('instagram') && company.instagram) parts.push(`📷 ${company.instagram}`)
  if (block.config.fields.includes('whatsapp') && company.whatsapp) parts.push(`💬 ${company.whatsapp}`)
  if (block.config.fields.includes('website') && company.website) parts.push(`🌐 ${company.website}`)

  if (block.config.layout === 'inline') {
    doc.text(parts.join('  |  '), 15, ctx.y)
    return ctx.y + 6
  } else {
    parts.forEach((p, i) => doc.text(p, 15, ctx.y + i * 4))
    return ctx.y + parts.length * 4 + 2
  }
}

function renderClient(ctx: PDFContext, block: Extract<QuoteBlock, { type: 'client' }>): number {
  const { doc, quote } = ctx
  doc.setFont(ctx.layout.theme.fontFamily, 'bold')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text('CLIENTE', 15, ctx.y)
  ctx.y += 5

  doc.setFont(ctx.layout.theme.fontFamily, 'normal')
  doc.setFontSize(10)
  doc.setTextColor(15, 20, 25)

  if (block.config.layout === 'horizontal') {
    const parts: string[] = []
    if (block.config.fields.includes('name')) parts.push(quote.client_name)
    if (block.config.fields.includes('phone') && quote.client_phone) parts.push(quote.client_phone)
    if (block.config.fields.includes('email') && quote.client_email) parts.push(quote.client_email)
    doc.text(parts.join('  •  '), 15, ctx.y)
    return ctx.y + 7
  } else {
    let y = ctx.y
    if (block.config.fields.includes('name')) { doc.setFont(ctx.layout.theme.fontFamily, 'bold'); doc.text(quote.client_name, 15, y); y += 5 }
    doc.setFont(ctx.layout.theme.fontFamily, 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    if (block.config.fields.includes('phone') && quote.client_phone) { doc.text(quote.client_phone, 15, y); y += 4 }
    if (block.config.fields.includes('email') && quote.client_email) { doc.text(quote.client_email, 15, y); y += 4 }
    return y + 3
  }
}

function renderItemsTable(ctx: PDFContext, block: Extract<QuoteBlock, { type: 'items_table' }>): number {
  const { doc, items } = ctx
  const [pr, pg, pb] = hexToRgb(ctx.layout.theme.primaryColor)
  const [zr, zg, zb] = hexToRgb(block.config.zebraColor)

  const colMap: Record<string, { header: string; dataKey: string }> = {
    description: { header: 'Serviço', dataKey: 'description' },
    qty: { header: 'Qtd', dataKey: 'qty' },
    unit: { header: 'Unid.', dataKey: 'unit' },
    price: { header: 'Valor', dataKey: 'price' },
    total: { header: 'Total', dataKey: 'total' },
  }

  const columns = block.config.columns.map(c => colMap[c]).filter(Boolean)

  const body = items.map(item => {
    const row: Record<string, string | number> = {}
    if (block.config.columns.includes('description')) row.description = item.description
    if (block.config.columns.includes('qty')) row.qty = item.quantity
    if (block.config.columns.includes('unit')) row.unit = item.unit
    if (block.config.columns.includes('price')) row.price = `R$ ${fmt(item.unit_price)}`
    if (block.config.columns.includes('total')) row.total = `R$ ${fmt(item.total)}`
    return row
  })

  autoTable(doc, {
    startY: ctx.y,
    columns: columns.map(c => ({ header: c.header, dataKey: c.dataKey })),
    body,
    theme: 'plain',
    margin: { left: 15, right: 15 },
    headStyles: { fillColor: [pr, pg, pb], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [zr, zg, zb] },
    columnStyles: {
      qty: { halign: 'center' },
      unit: { halign: 'center' },
      price: { halign: 'right' },
      total: { halign: 'right', fontStyle: 'bold' },
    },
  })

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5
}

function renderTotals(ctx: PDFContext, block: Extract<QuoteBlock, { type: 'totals' }>): number {
  const { doc, quote } = ctx
  const [pr, pg, pb] = hexToRgb(ctx.layout.theme.primaryColor)
  const [sr, sg, sb] = hexToRgb(ctx.layout.theme.secondaryColor)
  const alignX = block.config.position === 'right' ? 195 : 105
  const labelOff = block.config.position === 'right' ? -45 : -25

  let y = ctx.y

  if (block.config.showSubtotal) {
    doc.setFont(ctx.layout.theme.fontFamily, 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text('Subtotal', alignX + labelOff, y)
    doc.text(`R$ ${fmt(quote.subtotal)}`, alignX, y, { align: 'right' })
    y += 5
  }

  if (block.config.showDiscount && quote.discount > 0) {
    doc.setTextColor(sr, sg, sb)
    doc.text('Desconto', alignX + labelOff, y)
    doc.text(`- R$ ${fmt(quote.discount)}`, alignX, y, { align: 'right' })
    y += 5
  }

  doc.setDrawColor(226, 232, 240)
  doc.line(alignX + labelOff, y, alignX, y)
  y += 4

  doc.setFont(ctx.layout.theme.fontFamily, 'bold')
  doc.setFontSize(12)
  doc.setTextColor(pr, pg, pb)
  doc.text('Total', alignX + labelOff, y)
  doc.text(`R$ ${fmt(quote.total)}`, alignX, y, { align: 'right' })

  return y + 10
}

function renderFreeText(ctx: PDFContext, block: Extract<QuoteBlock, { type: 'free_text' }>): number {
  if (!block.config.content) return ctx.y
  const { doc } = ctx
  const [r, g, b] = hexToRgb(block.config.color)
  doc.setFont(ctx.layout.theme.fontFamily, block.config.bold ? 'bold' : 'normal')
  doc.setFontSize(9)
  doc.setTextColor(r, g, b)

  const lines = doc.splitTextToSize(block.config.content, 180)
  doc.text(lines, 15, ctx.y)
  return ctx.y + lines.length * 4.5 + 4
}

function renderPaymentTerms(ctx: PDFContext, block: Extract<QuoteBlock, { type: 'payment_terms' }>): number {
  const { doc, quote } = ctx
  if (!quote.payment_terms) return ctx.y

  doc.setFont(ctx.layout.theme.fontFamily, 'bold')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text('CONDIÇÕES DE PAGAMENTO', 15, ctx.y)
  ctx.y += 5

  doc.setFont(ctx.layout.theme.fontFamily, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(51, 65, 85)

  if (block.config.layout === 'list') {
    const terms = quote.payment_terms.split(/[;\n]/).filter(Boolean)
    terms.forEach((t, i) => { doc.text(`• ${t.trim()}`, 17, ctx.y + i * 4.5) })
    return ctx.y + terms.length * 4.5 + 4
  } else {
    const lines = doc.splitTextToSize(quote.payment_terms, 180)
    doc.text(lines, 15, ctx.y)
    return ctx.y + lines.length * 4.5 + 4
  }
}

function renderSignature(ctx: PDFContext, block: Extract<QuoteBlock, { type: 'signature' }>): number {
  const { doc } = ctx
  const y = ctx.y + 10

  doc.setDrawColor(51, 65, 85)
  doc.setFont(ctx.layout.theme.fontFamily, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)

  if (block.config.columns === 2) {
    doc.line(20, y, 90, y)
    doc.text(block.config.labels[0] || 'Contratante', 55, y + 4, { align: 'center' })
    doc.line(120, y, 190, y)
    doc.text(block.config.labels[1] || 'Contratado', 155, y + 4, { align: 'center' })
  } else {
    doc.line(40, y, 170, y)
    doc.text(block.config.labels[0] || 'Assinatura', 105, y + 4, { align: 'center' })
  }

  return y + 12
}

function renderDivider(ctx: PDFContext, block: Extract<QuoteBlock, { type: 'divider' }>): number {
  const { doc } = ctx
  const [r, g, b] = hexToRgb(block.config.color)
  doc.setDrawColor(r, g, b)
  doc.setLineWidth(block.config.thickness * 0.3)
  doc.line(15, ctx.y, 195, ctx.y)
  return ctx.y + 5
}

function renderFooter(ctx: PDFContext, block: Extract<QuoteBlock, { type: 'footer' }>): number {
  const { doc } = ctx
  doc.setFont(ctx.layout.theme.fontFamily, 'normal')
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)

  const startY = ctx.y + 3
  doc.setDrawColor(241, 245, 249)
  doc.line(15, startY - 2, 195, startY - 2)

  let offsetY = startY
  if (block.config.text) {
    doc.text(block.config.text, 105, offsetY, { align: 'center' })
    offsetY += 4
  }
  if (block.config.showBranding) {
    doc.text('Gerado por OrcaIA', 105, offsetY, { align: 'center' })
    offsetY += 4
  }
  return offsetY
}

export function generateQuotePDFFromLayout(
  layout: QuoteLayout,
  company: Company,
  quote: Quote,
  items: QuoteItem[],
  logoImage?: string | null,
): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4')
  doc.setFont(layout.theme.fontFamily)

  const ctx: PDFContext = { doc, y: 0, layout, company, quote, items }

  for (const block of layout.blocks) {
    // Page break if needed (leave room for footer)
    if (ctx.y > 260 && block.type !== 'footer') {
      doc.addPage()
      ctx.y = 15
    }

    switch (block.type) {
      case 'header': ctx.y = renderHeader(ctx, block, logoImage); break
      case 'contact': ctx.y = renderContact(ctx, block); break
      case 'client': ctx.y = renderClient(ctx, block); break
      case 'items_table': ctx.y = renderItemsTable(ctx, block); break
      case 'totals': ctx.y = renderTotals(ctx, block); break
      case 'free_text': ctx.y = renderFreeText(ctx, block); break
      case 'payment_terms': ctx.y = renderPaymentTerms(ctx, block); break
      case 'signature': ctx.y = renderSignature(ctx, block); break
      case 'divider': ctx.y = renderDivider(ctx, block); break
      case 'footer': ctx.y = renderFooter(ctx, block); break
      case 'photos':
        // Photos placeholder — rendered when images are provided
        ctx.y += 5
        break
    }
  }

  return doc
}
