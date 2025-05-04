import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import * as puppeteer from 'puppeteer';
import { TAX_RATE, TAX_RATE_DISPLAY } from '@/lib/constants';

interface Detailedquote {
  quote_id: string;
  customer_id: number;
  customer_name: string;
  customer_address: string | null;
  date: string;

  totalamount: number | string;
  status: string;
  po_number: string;
  vin: string;
  description: string;
  subtotal: number | string;
  tax_total: number | string;
  private_comments: string;
  services: quoteService[];
}

interface quoteService {
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
    const cleanStr = value.toString().replace(/^"|"$/g, '');
    numValue = parseFloat(cleanStr);
  } else if (typeof value === 'object') {
    try {
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

async function getquote(id: string): Promise<Detailedquote | null> {
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
      FROM quotes i
      JOIN customer c ON i.customer_id = c.customer_id
      LEFT JOIN quotedetail id ON i.quote_id = id.quote_id
      LEFT JOIN services s ON id.service_id = s.service_id
      WHERE i.quote_id = $1
      GROUP BY i.quote_id, c.customer_id, c.customer_name, c.customer_address
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const quote = result.rows[0];
    if (quote.services && quote.services[0] && quote.services[0].service_id === null) {
      quote.services = [];
    }

    return quote;
  } catch (err) {
    console.error('Error fetching quote:', err);
    return null;
  }
}

function generateHtml(quote: Detailedquote): string {

  let vehicleYear = '';
  let vehicleMakeModel = '';
  let description = quote.description || '';
  const po_number = quote.po_number;

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

  // Format items for the quote
  const items = quote.services.map(service => {
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

  let calculatedSubtotal = 0;
  let calculatedTaxTotal = 0;

  items.forEach(item => {
    const itemPrice = parseFloat(item.unitPrice);
    const itemQuantity = item.quantity;
    const itemSubtotal = itemPrice * itemQuantity;
    calculatedSubtotal += itemSubtotal;

    if (parseFloat(item.taxRate) > 0) {
      calculatedTaxTotal += itemSubtotal * (parseFloat(item.taxRate) / 100);
    }
  });


  // Extract VIN last 8 if available
  const vinLast8 = quote.vin && quote.vin.length >= 8 ? quote.vin.slice(-8) : '';

  const showStatusBanner = quote.status === 'paid' || quote.status === 'overdue';
  const statusText = quote.status === 'paid' ? 'PAID' : 'OVERDUE';
  const statusColor = quote.status === 'paid' ? '#28a745' : '#dc3545';

  // Prepare HTML template with mustache-style variables
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote ${quote.quote_id}</title>
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
    
    .quote-details {
      text-align: right;
    }
    
    .quote-title {
      font-size: 16pt; 
      color: var(--primary-color);
      font-weight: bold;
      margin-bottom: 5px; 
    }
    
    .quote-data {
      display: grid;
      grid-template-columns: max-content auto;
      gap: 3px 10px; 
      font-size: 8pt; 
    }
    
    .quote-data dt {
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
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAAAyCAAAAACb533GAAAAAmJLR0QA/4ePzL8AAAJpSURBVFjD7dfRUtpAFMZx3/8NviXEGCUCooOKmEEImEbaUkRAhBT2/y69SB2r0tYZ6Awzzbnai52dX/acPXOyx07GXs7KWTkrZ+WsnJWzctaWWct0+bz8/rL8U3xw22asWCbKVnWZ8UfOc1X59yxblvMEMJCu2BkWD0YNwAZy0x1icSkzgUSK2SXWoqhTVgc6tgD9quOUOkuwvh8DbT+A68O7Ucn03rGerg7Mfn0MMK175jDsdIYwb/rGPRtt2iB60rArMwJoSsaRykusFAGhXLhQzZXesSauVJRMH8aO/KojKWLqSY5kkg1ZtqQTTw2AL1K4sn2j8A1LXtSbvWWV5E9YVOSkXKhqeTS6h7K8B9KaCvMN2+m99LPeT+VboC7XvmaZ6fvaGkkJMJFuqSkE9jVgkl3rTOps2uXPnzPkqQ4QSbPXrKM1Jd+THgEcNbiRP7OJnAWJNAbYz47ahBVJ9wAUs1zG0vQ1q7SGFUmLDHDOsioZFfpwK80AfJ1tjXWkGsCNlP6ddZfdy8ooxJ47zWZ3npXnELBO9oVbYTVVmIM90jFkr6D+e9bcqAkk0oC+/OFTCpA6usx0n7fGmrvyo7giDaCuQiuuag3LCYIgCHpcS42kVVAVhpKkQuUrtKSLpOUosFtjMfIkyYmBmSvJW5fELEJsQ5JUTWHmu2XflcwE2zSSVJ5vPG9N4vj5kFW/FcaLrP1H17109SmBYdx/2ZzEWYyAaRS2h8DS0xiYGN0B027Y/rYLY+BcGgEP5pf+tgvT6ZlM6eRIau/W0LzqBkUVT0fsFiv/88lZOStn5ayclbNy1n/M+gHCvNOgpDSG9QAAAABJRU5ErkJggg==" alt="Company Logo" class="company-logo">
      <div class="company-details">
        <h2>Carmine Potirniche</h2>
        <p>123 Main St</p>
        <p>City, State, Zipcode</p>
        <p>123-123-1234</p>
        <p>potirnichecarmine@gmail.com</p>
        <p>yourwebsite.com</p>
      </div>
    </div>
    <div class="quote-details">
      <h1 class="quote-title">Quote</h1>
      <dl class="quote-data">
        <dt>Quote No:</dt>
        <dd>${quote.quote_id}</dd>
        <dt>Date:</dt>
        <dd>${new Date(quote.date).toLocaleDateString()}</dd>
        <dt>Salesperson:</dt>
        <dd>Carmine</dd>
      </dl>
    </div>
  </div>
  
  <div class="client-section">
    <h3 class="section-title">Bill To:</h3>
    <div class="bill-to">
      <p><strong>${quote.customer_name}</strong></p>
      <p>${quote.customer_address || ''}</p>
    </div>
  </div>`;

  if (po_number) {
    html += `
  <div class="po-ro-section">
    <div class="po-ro-box" style="width: 100%">
      <strong>PO#:</strong> ${quote.po_number || ''}
    </div>
  </div>`;
  }

  html += `
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
    <span>$${formatCurrency(calculatedSubtotal)}</span>
  </div>
  <div class="total-row">
    <span>Tax:</span>
    <span>$${formatCurrency(calculatedTaxTotal)}</span>
  </div>
  <div class="total-row grand-total">
    <span>Total:</span>
    <span>$${formatCurrency(calculatedSubtotal + calculatedTaxTotal)}</span>
  </div>
  <div class="total-row">
    <span>Balance Due:</span>
    <span>$${quote.status === 'paid' ? '0.00' : formatCurrency(calculatedSubtotal + calculatedTaxTotal)}</span>
  </div>
</div>`;

  if (description) {
    html += `
  <div class="comments-section">
    <h3 class="section-title">Job Description:</h3>
    <p>${description}</p>
  </div>`;
  }
  if (quote.vin && quote.vin.trim() !== '') {
    html += `
    <div class="vehicle-info">
      <h3 class="section-title">Vehicle Information:</h3>
      <dl class="vehicle-details">
        <dt>VIN #:</dt>
        <dd>${quote.vin || 'N/A'}</dd>
        
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
    <p>If you have any questions about this quote, please contact us.</p>
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

    // Fetch quote data from database
    const quote = await getquote(id);

    if (!quote) {
      return NextResponse.json({ error: 'quote not found' }, { status: 404 });
    }

    const html = generateHtml(quote);

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
        'Content-Disposition': `inline; filename="quote-${id}.pdf"`,
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