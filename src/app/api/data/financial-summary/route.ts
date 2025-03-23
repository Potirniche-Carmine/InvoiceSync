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
      dateFilter = 'AND date BETWEEN $1 AND $2';
      params.push(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      dateFilter = 'AND date >= $1';
      params.push(new Date(startDate));
    } else if (endDate) {
      dateFilter = 'AND date <= $1';
      params.push(new Date(endDate));
    }
    
    const totalsQuery = `
      SELECT 
        SUM(tax_total) as total_tax,
        SUM(totalamount) as total_amount,
        COUNT(*) as invoice_count
      FROM invoices
      WHERE 1=1 ${dateFilter}
    `;
    
    const unpaidQuery = `
      SELECT 
        SUM(totalamount) as unpaid_total,
        COUNT(*) as unpaid_count
      FROM invoices
      WHERE status IN ('pending', 'overdue') ${dateFilter}
    `;
    
    const totalsResult = await client.query(totalsQuery, params);
    const unpaidResult = await client.query(unpaidQuery, params);
    
    return NextResponse.json({
      summary: {
        totalTax: totalsResult.rows[0].total_tax || 0,
        totalAmount: totalsResult.rows[0].total_amount || 0,
        invoiceCount: totalsResult.rows[0].invoice_count || 0,
        unpaidTotal: unpaidResult.rows[0].unpaid_total || 0,
        unpaidCount: unpaidResult.rows[0].unpaid_count || 0
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