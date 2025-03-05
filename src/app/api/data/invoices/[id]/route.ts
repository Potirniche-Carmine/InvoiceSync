import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/app/lib/db';
import type { Service } from '@/app/lib/types';
import { TAX_RATE } from '@/app/lib/constants';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  const invoice_id = id;
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
      dueDate,
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

    const invoiceQuery = {
      text: `
        UPDATE invoices SET
          date = $1,
          duedate = $2,
          totalamount = $3,
          po_number = $4,
          description = $5,
          vin = $6,
          private_comments = $7,
          subtotal = $8,
          tax_total = $9,
          customer_id = $10
        WHERE invoice_id = $11
        RETURNING invoice_id
      `,
      values: [
        startDate ? new Date(startDate) : new Date(),
        dueDate ? new Date(dueDate) : null,
        total_amount,
        PO,
        description,
        vin,
        comments,
        subtotal,
        tax_total,
        customer_id,
        invoice_id
      ]
    };

    const result = await client.query(invoiceQuery);

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Delete existing invoice details
    await client.query('DELETE FROM invoicedetail WHERE invoice_id = $1', [invoice_id]);

    // Insert updated service details
    for (const service of services) {
      if (!service.servicename || !service.service_id) continue;

      const quantity = Math.max(1, service.quantity || 1);
      const unit_price = Number(service.unitprice) || 0;
      const total_price = unit_price * quantity;

      const detailQuery = {
        text: `
          INSERT INTO invoicedetail (
            invoice_id,
            service_id,
            quantity,
            unitprice,
            totalprice
          ) VALUES ($1, $2, $3, $4, $5)
        `,
        values: [invoice_id, service.service_id, quantity, unit_price, total_price]
      };

      await client.query(detailQuery);
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Invoice updated successfully',
      invoice_id
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice', details: error instanceof Error ? error.message : 'Unknown error' },
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
  const invoice_id = id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM invoicedetail WHERE invoice_id = $1', [invoice_id]);

    const result = await client.query(
      'DELETE FROM invoices WHERE invoice_id = $1 RETURNING invoice_id',
      [invoice_id]
    );

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    await client.query('COMMIT');
    return NextResponse.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
