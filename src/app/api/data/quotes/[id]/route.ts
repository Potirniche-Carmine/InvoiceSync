import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import type { Service } from '@/lib/types';
import { TAX_RATE } from '@/lib/constants';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  const quote_id = id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      customer_id,
      PO,
      description,
      comments,
      vin,
      startDate,
      services,
    } = await request.json();

    const subtotal = services.reduce((acc: number, service: Service) => {
      const quantity = service.quantity || 1;
      const unitPrice = Number(service.unitprice) || 0;
      return acc + quantity * unitPrice;
    }, 0);

    const tax_total = services.reduce((acc: number, service: Service) => {
      if (!service.istaxed) return acc;
      const quantity = service.quantity || 1;
      const unitPrice = Number(service.unitprice) || 0;
      return acc + quantity * unitPrice * TAX_RATE;
    }, 0);

    const total_amount = subtotal + tax_total;

    const quoteQuery = {
      text: `
        UPDATE quotes SET
          date = $1,
          totalamount = $2,
          po_number = $3,
          description = $4,
          vin = $5,
          private_comments = $6,
          subtotal = $7,
          tax_total = $8,
          customer_id = $9
        WHERE quote_id = $10
        RETURNING quote_id
      `,
      values: [
        startDate ? new Date(startDate) : new Date(),
        total_amount,
        PO,
        description,
        vin,
        comments,
        subtotal,
        tax_total,
        customer_id,
        quote_id
      ]
    };

    const result = await client.query(quoteQuery);

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'quote not found' }, { status: 404 });
    }

    // Delete existing quote details
    await client.query('DELETE FROM quotedetail WHERE quote_id = $1', [quote_id]);

    // Insert updated service details
    for (const service of services) {
      if (!service.servicename || !service.service_id) continue;

      const quantity = Math.max(1, service.quantity || 1);
      const unit_price = Number(service.unitprice) || 0;
      const total_price = unit_price * quantity;

      const detailQuery = {
        text: `
          INSERT INTO quotedetail (
            quote_id,
            service_id,
            quantity,
            unitprice,
            totalprice
          ) VALUES ($1, $2, $3, $4, $5)
        `,
        values: [quote_id, service.service_id, quantity, unit_price, total_price]
      };

      await client.query(detailQuery);
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Quote updated successfully',
      quote_id
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating quote:', error);
    return NextResponse.json(
      { error: 'Failed to update quote', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  const quote_id = id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM quotedetail WHERE quote_id = $1', [quote_id]);

    const result = await client.query(
      'DELETE FROM quotes WHERE quote_id = $1 RETURNING quote_id',
      [quote_id]
    );

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'quote not found' }, { status: 404 });
    }

    await client.query('COMMIT');
    return NextResponse.json({ success: true, message: 'quote deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting quote:', error);
    return NextResponse.json(
      { error: 'Failed to delete quote', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
