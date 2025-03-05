import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db';

export async function POST(request: Request) {
  const authHeader = request.headers.get('x-cron-secret');
  
  if (authHeader !== process.env.CRON_SECRET_TOKEN) {
    console.warn('Unauthorized attempt to access cron endpoint');
    return NextResponse.json(
      { error: 'Unauthorized' }, 
      { status: 401 }
    );
  }
  
  const client = await pool.connect();
  try {
    const result = await client.query(`
      UPDATE invoices
      SET status = 'overdue'
      WHERE duedate < CURRENT_DATE AND status = 'pending'
      RETURNING invoice_id
    `);
    
    console.log(`Updated ${result.rowCount} invoices to overdue status`);
    
    return NextResponse.json({ 
      success: true, 
      updatedCount: result.rowCount,
      updatedInvoices: result.rows.map(row => row.invoice_id) 
    });
  } catch (error) {
    console.error('Error updating overdue invoices:', error);
    return NextResponse.json(
      { error: 'Failed to update overdue invoices' }, 
      { status: 500 }
    );
  } finally {
    client.release();
  }
}