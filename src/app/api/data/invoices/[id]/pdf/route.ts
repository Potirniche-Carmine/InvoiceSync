import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import * as puppeteer from 'puppeteer';
import { TAX_RATE, TAX_RATE_DISPLAY } from '@/lib/constants';

interface DetailedInvoice {
  invoice_id: string;
  customer_id: number;
  customer_name: string;
  customer_address: string | null;
  date: string;
  duedate: string;
  totalamount: number | string;
  status: string;
  po_number: string;
  vin: string;
  description: string;
  subtotal: number | string;
  tax_total: number | string;
  private_comments: string;
  services: InvoiceService[];
}

interface InvoiceService {
  service_id: number;
  servicename: string;
  description: string;
  quantity: number;
  unitprice: number;
  totalprice: number;
  istaxed: boolean;
}

function formatCurrency(value: unknown): string {
  if (value === null || value === undefined) return "0.00";
  
  let numValue: number;
  
  if (typeof value === 'number') {
    numValue = value;
  } else if (typeof value === 'string') {
    // Remove any quotes if they exist
    const cleanStr = value.toString().replace(/^"|"$/g, '');
    numValue = parseFloat(cleanStr);
  } else if (typeof value === 'object') {
    try {
      // Try to convert to string then parse
      const strValue = String(value);
      numValue = parseFloat(strValue);
    } catch {
      numValue = 0;
    }
  } else {
    numValue = 0;
  }
  
  if (isNaN(numValue)) return "0.00";
  
  return numValue.toFixed(2);
}

async function getInvoice(id: string): Promise<DetailedInvoice | null> {
  try {
    const query = `
      SELECT 
        i.*,
        c.customer_id,
        c.customer_name,
        c.customer_address,
        COALESCE(
          json_agg(
            json_build_object(
              'service_id', s.service_id,
              'servicename', s.servicename,
              'description', s.description,
              'quantity', id.quantity,
              'unitprice', id.unitprice,
              'totalprice', id.totalprice,
              'istaxed', s.istaxed
            )
          ) FILTER (WHERE s.service_id IS NOT NULL),
          '[]'::json
        ) as services
      FROM invoices i
      JOIN customer c ON i.customer_id = c.customer_id
      LEFT JOIN invoicedetail id ON i.invoice_id = id.invoice_id
      LEFT JOIN services s ON id.service_id = s.service_id
      WHERE i.invoice_id = $1
      GROUP BY i.invoice_id, c.customer_id, c.customer_name, c.customer_address
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const invoice = result.rows[0];
    if (invoice.services && invoice.services[0] && invoice.services[0].service_id === null) {
      invoice.services = [];
    }
    
    return invoice;
  } catch (err) {
    console.error('Error fetching invoice:', err);
    return null;
  }
}

function generateHtml(invoice: DetailedInvoice): string {
  // Format dates
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Extract vehicle information from description if available
  let vehicleYear = '';
  let vehicleMakeModel = '';
  let description = invoice.description || '';
  const po_number = invoice.po_number;
  
  // Try to extract vehicle info from description
  const vehicleInfoRegex = /------------------------------\s*(.*?)\s*\nLast 8#:/;
  const match = description.match(vehicleInfoRegex);
  
  if (match && match[1]) {
    const vehicleInfo = match[1].trim();
    const parts = vehicleInfo.split(' ');
    
    // If we have at least 3 parts (Year Make Model)
    if (parts.length >= 3) {
      // Assume first part with 4 digits is year
      const yearMatch = parts.find(part => /^\d{4}$/.test(part));
      if (yearMatch) {
        vehicleYear = yearMatch;
        // Remove year from parts to get make/model
        const makeModelParts = parts.filter(part => part !== yearMatch);
        vehicleMakeModel = makeModelParts.join(' ');
      } else {
        // If no year found, just use everything as make/model
        vehicleMakeModel = vehicleInfo;
      }
    } else {
      // Less than 3 parts, just use as is
      vehicleMakeModel = vehicleInfo;
    }
    
    // Remove the vehicle info section from description for the PDF
    description = description.replace(/------------------------------[\s\S]*?Last 8#:[^\n]*(\n|$)/, '').trim();
  }
  
  // Format items for the invoice
  const items = invoice.services.map(service => {
    const taxRate = service.istaxed ? TAX_RATE_DISPLAY : '0%';
    const unitPrice = service.unitprice;
    const quantity = service.quantity;
    const subtotal = unitPrice * quantity;
    const taxAmount = service.istaxed ? subtotal * TAX_RATE : 0;
    const totalWithTax = subtotal + taxAmount;
    
    return {
      quantity: quantity,
      description: service.servicename + (service.description ? ` - ${service.description}` : ''),
      unitPrice: formatCurrency(unitPrice),
      taxRate: taxRate,
      total: formatCurrency(totalWithTax)
    };
  });

  // Extract VIN last 8 if available
  const vinLast8 = invoice.vin && invoice.vin.length >= 8 ? invoice.vin.slice(-8) : '';

  const showStatusBanner = invoice.status === 'paid' || invoice.status === 'overdue';
  const statusText = invoice.status === 'paid' ? 'PAID' : 'OVERDUE';
  const statusColor = invoice.status === 'paid' ? '#28a745' : '#dc3545';
  
  // Prepare HTML template with mustache-style variables
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoice_id}</title>
  <style>
    :root {
      --primary-color: #0055a4;
      --secondary-color: #f8f9fa;
      --border-color: #dee2e6;
      --text-color: #000000;
      --light-text: #474747;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 9pt; 
    }
    
    body {
      color: var(--text-color);
      line-height: 1.3; 
      padding: 20px; 
      max-width: 8.5in;
      margin: 0 auto;
    }

    .status-banner {
      text-align: center;
      padding: 6px;
      margin-bottom: 15px;
      font-size: 14pt;
      font-weight: bold;
      letter-spacing: 1px;
      color: white;
      position: relative;
      border-radius: 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px; 
    }
    
    .company-info {
      display: flex;
      gap: 10px; 
    }
    
    .company-logo {
      max-width: 80px;
      max-height: 40px;
    }
    
    .company-details {
      font-size: 8pt;
      color: var(--light-text);
    }
    
    .company-details h2 {
      font-size: 12pt; 
    }
    
    .invoice-details {
      text-align: right;
    }
    
    .invoice-title {
      font-size: 16pt; 
      color: var(--primary-color);
      font-weight: bold;
      margin-bottom: 5px; 
    }
    
    .invoice-data {
      display: grid;
      grid-template-columns: max-content auto;
      gap: 3px 10px; 
      font-size: 8pt; 
    }
    
    .invoice-data dt {
      font-weight: 600;
      text-align: right;
    }
    
    .client-section {
      margin-bottom: 15px; 
    }
    
    .section-title {
      font-size: 10pt; 
      font-weight: bold;
      color: var(--primary-color);
      margin-bottom: 3px; 
    }
    
    .bill-to {
      padding: 8px; 
      background-color: var(--secondary-color);
      border-radius: 3px; 
    }
    
    .po-ro-section {
      display: flex;
      gap: 15px;
      margin-bottom: 15px; 
    }
    
    .po-ro-box {
      padding: 6px 10px;
      background-color: var(--secondary-color);
      border-radius: 3px; 
      border: 1px solid var(--border-color);
      flex: 1;
    }
    
    .po-ro-box strong {
      color: var(--primary-color);
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px; 
      font-size: 8pt; 
    }
    
    th {
      background-color: var(--primary-color);
      color: white;
      text-align: left;
      padding: 5px;
    }
    
    td {
      padding: 5px;
      border-bottom: 1px solid var(--border-color);
    }
    
    .amount-cell, .tax-cell {
      text-align: right;
    }
    
    .total-section {
      width: 200px;
      margin-left: auto;
      margin-bottom: 15px; 
      font-size: 8pt; 
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
    }
    
    .total-row.grand-total {
      font-weight: bold;
      font-size: 10pt; 
      border-top: 1px solid var(--primary-color); 
      padding-top: 5px;
      margin-top: 3px; 
    }
    
    .comments-section {
      margin-bottom: 15px;
      padding: 8px;
      background-color: var(--secondary-color);
      border-radius: 3px; 
      white-space: pre-line;
      font-size: 8pt; 
    }
    
    .vehicle-info {
      margin-bottom: 30px; 
      padding: 8px;
      background-color: var(--secondary-color);
      border-radius: 3px; 
      font-size: 8pt; 
    }
    
    .vehicle-details {
      display: grid;
      grid-template-columns: auto auto;
      gap: 3px 15px;
    }
    
    .vehicle-details dt {
      font-weight: 600;
    }
    
    .signature-section {
      margin-top: 30px; 
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }
    
    .signature-line {
      margin-top: 30px; 
      border-top: 1px solid var(--text-color);
      position: relative;
    }
    
    .signature-title {
      position: absolute;
      top: 3px; /* Reduced position */
      left: 0;
      font-size: 7pt; /* Smaller signature text */
      color: var(--light-text);
    }
    
    .footer {
      margin-top: 25px; 
      text-align: center;
      color: var(--light-text);
      font-size: 8pt; /* Smaller footer text */
      border-top: 1px solid var(--border-color);
      padding-top: 10px;
    }
    
    .thank-you {
      font-size: 10pt; 
      color: var(--primary-color);
      font-weight: bold;
      margin-top: 10px;
      margin-bottom: 10px; 
    }
  </style>
</head>
<body>`;
if (showStatusBanner) {
    html += `
  <div class="status-banner" style="background-color: ${statusColor};">
    ${statusText}
  </div>`;
  }
    html += `
  <div class="header">
    <div class="company-info">
      <img src="data:image/png;base64,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" alt="Company Logo" class="company-logo">
      <div class="company-details">
        <h2>Locksmith4U</h2>
        <p>10258 Falling Needle Ave</p>
        <p>Las Vegas, Nevada, 89135</p>
        <p>702-720-7509</p>
        <p>locksmith4ulasvegas@gmail.com</p>
        <p>locksmith4uvegas.com</p>
      </div>
    </div>
    
    <div class="invoice-details">
      <h1 class="invoice-title">Invoice</h1>
      <dl class="invoice-data">
        <dt>Invoice No:</dt>
        <dd>${invoice.invoice_id}</dd>
        
        <dt>Date:</dt>
        <dd>${formatDate(invoice.date)}</dd>
        
        <dt>Due Date:</dt>
        <dd>${formatDate(invoice.duedate)}</dd>
        
        <dt>Salesperson:</dt>
        <dd>Julian</dd>
      </dl>
    </div>
  </div>
  
  <div class="client-section">
    <h3 class="section-title">Bill To:</h3>
    <div class="bill-to">
      <p><strong>${invoice.customer_name}</strong></p>
      <p>${invoice.customer_address || ''}</p>
    </div>
  </div>`;

  if (po_number) {
  html += `
  <div class="po-ro-section">
    <div class="po-ro-box" style="width: 100%">
      <strong>PO#:</strong> ${invoice.po_number || ''}
    </div>
  </div>`;
  }
  html +=`
  <table>
    <thead>
      <tr>
        <th>Qty</th>
        <th>Description</th>
        <th>Unit Price</th>
        <th class="tax-cell">Tax %</th>
        <th class="amount-cell">Total</th>
      </tr>
    </thead>
    <tbody>`;

  items.forEach(item => {
    html += `
      <tr>
        <td>${item.quantity}</td>
        <td>${item.description}</td>
        <td>$${item.unitPrice}</td>
        <td class="tax-cell">${item.taxRate}</td>
        <td class="amount-cell">$${item.total}</td>
      </tr>`;
  });

  html += `
    </tbody>
  </table>
  
  <div class="total-section">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>$${formatCurrency(invoice.subtotal)}</span>
    </div>
    <div class="total-row">
      <span>Tax:</span>
      <span>$${formatCurrency(invoice.tax_total)}</span>
    </div>
    <div class="total-row grand-total">
      <span>Total:</span>
      <span>$${formatCurrency(invoice.totalamount)}</span>
    </div>
    <div class="total-row">
      <span>Balance Due:</span>
      <span>$${invoice.status === 'paid' ? '0.00' : formatCurrency(invoice.totalamount)}</span>
    </div>
  </div>`;

  if (description) {
    html += `
  <div class="comments-section">
    <h3 class="section-title">Job Description:</h3>
    <p>${description}</p>
  </div>`;
  }
  
  if (invoice.vin && invoice.vin.trim() !== '') {
    html += `
    <div class="vehicle-info">
      <h3 class="section-title">Vehicle Information:</h3>
      <dl class="vehicle-details">
        <dt>VIN #:</dt>
        <dd>${invoice.vin || 'N/A'}</dd>
        
        <dt>Last 8:</dt>
        <dd>${vinLast8 || 'N/A'}</dd>
        
        <dt>Make/Model:</dt>
        <dd>${vehicleMakeModel || 'N/A'}</dd>
        
        <dt>Year:</dt>
        <dd>${vehicleYear || 'N/A'}</dd>
      </dl>
    </div>`;
  }
  
  html += `
  <div class="signature-section">
    <div>
      <div class="signature-line">
        <span class="signature-title">Customer Signature</span>
      </div>
    </div>
    <div>
      <div class="signature-line">
        <span class="signature-title">Print Name</span>
      </div>
    </div>
  </div>
  
  <div class="footer">
    <p class="thank-you">Thank you for your business!</p>
    <p>If you have any questions about this invoice, please contact us.</p>
  </div>
</body>
</html>`;

  return html;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    
    // Fetch invoice data from database
    const invoice = await getInvoice(id);
    
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    // Generate HTML from invoice data
    const html = generateHtml(invoice);
    
    // Launch puppeteer to convert HTML to PDF
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });
    
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.4in',
        right: '0.4in',
        bottom: '0.4in',
        left: '0.4in',
      },
    });
    
    await browser.close();
    
    // Return PDF as response
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}