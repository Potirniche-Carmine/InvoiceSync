import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  
  const client = await pool.connect();
  
  try {
    const params: Date[] = [];
    let dateFilter = '';
    
    if (startDate && endDate) {
      dateFilter = 'AND i.date BETWEEN $1 AND $2';
      params.push(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      dateFilter = 'AND i.date >= $1';
      params.push(new Date(startDate));
    } else if (endDate) {
      dateFilter = 'AND i.date <= $1';
      params.push(new Date(endDate));
    }
    
    const totalsQuery = `
      SELECT 
        SUM(tax_total) as total_tax,
        SUM(totalamount) as total_amount,
        COUNT(*) as invoice_count
      FROM invoices i
      WHERE 1=1 ${dateFilter}
    `;
    
    const unpaidQuery = `
      SELECT 
        SUM(totalamount) as unpaid_total,
        COUNT(*) as unpaid_count
      FROM invoices i
      WHERE status IN ('pending', 'overdue') ${dateFilter}
    `;
    
    // New query to calculate parts total
    const partsQuery = `
      SELECT 
        SUM(id.totalprice) as parts_total
      FROM invoices i
      JOIN invoicedetail id ON i.invoice_id = id.invoice_id
      JOIN services s ON id.service_id = s.service_id
      WHERE s.isparts = true ${dateFilter}
    `;
    
    const totalsResult = await client.query(totalsQuery, params);
    const unpaidResult = await client.query(unpaidQuery, params);
    const partsResult = await client.query(partsQuery, params);
    
    return NextResponse.json({
      summary: {
        totalTax: totalsResult.rows[0].total_tax || 0,
        totalAmount: totalsResult.rows[0].total_amount || 0,
        invoiceCount: totalsResult.rows[0].invoice_count || 0,
        unpaidTotal: unpaidResult.rows[0].unpaid_total || 0,
        unpaidCount: unpaidResult.rows[0].unpaid_count || 0,
        partsTotal: partsResult.rows[0].parts_total || 0 // Add parts total to the summary
      }
    });
    
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial summary' }, 
      { status: 500 }
    );
  } finally {
    client.release();
  }
}