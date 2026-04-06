import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Quote, QuoteItem, Company } from './types'

// Add type for better dev experience and to avoid 'any'
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number
  }
}

export function generateQuotePDF(quote: Quote, items: QuoteItem[], company: Company) {
  const doc = new jsPDF()

  // Colors
  const primary = [10, 102, 194] as [number, number, number]
  const accent = [0, 212, 170] as [number, number, number]
  const dark = [15, 20, 25] as [number, number, number]

  // Header bar
  doc.setFillColor(...primary)
  doc.rect(0, 0, 210, 35, 'F')

  // Company name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(company.name || 'Minha Empresa', 14, 18)

  // Company info
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const companyInfo = [company.phone, company.email, company.address].filter(Boolean).join(' | ')
  if (companyInfo) doc.text(companyInfo, 14, 27)

  // Quote label
  doc.setTextColor(...dark)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('ORÇAMENTO', 14, 48)

  // Quote meta
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text(`Data: ${new Date(quote.created_at).toLocaleDateString('pt-BR')}`, 14, 56)
  doc.text(`Validade: ${quote.validity_days} dias`, 14, 62)

  // Status on right side
  const statusLabels: Record<string, string> = { draft: 'Rascunho', sent: 'Enviado', approved: 'Aprovado', rejected: 'Rejeitado' }
  doc.setTextColor(...primary)
  doc.setFont('helvetica', 'bold')
  doc.text(statusLabels[quote.status] || quote.status, 196, 48, { align: 'right' })

  // Client section
  doc.setDrawColor(230, 230, 230)
  doc.line(14, 68, 196, 68)
  doc.setTextColor(100, 116, 139)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENTE', 14, 76)

  doc.setTextColor(...dark)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(quote.client_name, 14, 83)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  let clientY = 89
  if (quote.client_phone) { doc.text(quote.client_phone, 14, clientY); clientY += 5 }
  if (quote.client_email) { doc.text(quote.client_email, 14, clientY); clientY += 5 }

  // Items table
  const tableStartY = clientY + 6

  autoTable(doc, {
    startY: tableStartY,
    head: [['Serviço', 'Qtd', 'Unidade', 'Valor Unit.', 'Total']],
    body: items.map(item => [
      item.description,
      String(item.quantity),
      item.unit,
      `R$ ${Number(item.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${Number(item.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: dark,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 30, fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  })

  // Totals
  const finalY = (doc as unknown as jsPDFWithAutoTable).lastAutoTable.finalY + 8

  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text('Subtotal:', 140, finalY, { align: 'right' })
  doc.setTextColor(...dark)
  doc.text(`R$ ${Number(quote.subtotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 196, finalY, { align: 'right' })

  let totalsY = finalY
  if (Number(quote.discount) > 0) {
    totalsY += 6
    doc.setTextColor(...accent)
    doc.text('Desconto:', 140, totalsY, { align: 'right' })
    doc.text(`- R$ ${Number(quote.discount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 196, totalsY, { align: 'right' })
  }

  totalsY += 8
  doc.setDrawColor(230, 230, 230)
  doc.line(120, totalsY - 2, 196, totalsY - 2)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primary)
  doc.text('Total:', 140, totalsY + 5, { align: 'right' })
  doc.text(`R$ ${Number(quote.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 196, totalsY + 5, { align: 'right' })

  // Payment terms
  let infoY = totalsY + 18
  if (quote.payment_terms) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 116, 139)
    doc.text('CONDIÇÕES DE PAGAMENTO', 14, infoY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...dark)
    doc.text(quote.payment_terms, 14, infoY + 6)
    infoY += 16
  }

  if (quote.notes) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 116, 139)
    doc.text('OBSERVAÇÕES', 14, infoY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...dark)
    const splitNotes = doc.splitTextToSize(quote.notes, 180)
    doc.text(splitNotes, 14, infoY + 6)
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text(`Gerado por OrcaIA em ${new Date().toLocaleDateString('pt-BR')}`, 105, pageHeight - 10, { align: 'center' })

  // Download
  const fileName = `orcamento-${quote.client_name.toLowerCase().replace(/\s+/g, '-')}-${new Date(quote.created_at).toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}
