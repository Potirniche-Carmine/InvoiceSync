import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  const invoice_id = id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { paymentMethod } = await request.json();

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      );
    }

    const updateInvoiceQuery = {
      text: `
        UPDATE invoices 
        SET status = 'paid'
        WHERE invoice_id = $1
        RETURNING invoice_id, totalamount
      `,
      values: [invoice_id]
    };

    const invoiceResult = await client.query(updateInvoiceQuery);

    if (invoiceResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const paymentQuery = {
      text: `
        INSERT INTO payment (
          invoice_id, 
          paymentdate, 
          paymentmethod
        ) VALUES ($1, NOW(), $2)
        RETURNING payment_id
      `,
      values: [invoice_id, paymentMethod]
    };
    
    const paymentResult = await client.query(paymentQuery);
    const payment_id = paymentResult.rows[0].payment_id;

    await client.query('COMMIT');
    
    return NextResponse.json({
      success: true,
      message: `Invoice marked as paid with ${paymentMethod}`,
      invoice_id,
      payment_id
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process payment', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  } finally {
    client.release();
  }
}