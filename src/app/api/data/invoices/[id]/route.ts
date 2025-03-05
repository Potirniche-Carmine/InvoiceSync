import { NextResponse } from 'next/server';
import { pool } from '@/app/lib/db';
import type { Service } from '@/app/lib/types';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
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
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    // Handle case where services might be null
    const invoice = result.rows[0];
    if (invoice.services && invoice.services[0] && invoice.services[0].service_id === null) {
      invoice.services = [];
    }
    
    return NextResponse.json({ invoice });
  } catch (err) {
    console.error('Error fetching invoice:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const invoice_id = params.id;
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

    const TAX_RATE = 0.0875;

    // Calculate totals
    const subtotal = services.reduce((acc: number, service: Service) => {
      const quantity = service.quantity || 1;
      const unitPrice = Number(service.unitprice) || 0;
      return acc + (quantity * unitPrice);
    }, 0);
  
    const tax_total = services.reduce((acc: number, service: Service) => {
      if (!service.istaxed) return acc;
      const quantity = service.quantity || 1;
      const unitPrice = Number(service.unitprice) || 0;
      return acc + (quantity * unitPrice * TAX_RATE);
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
        values: [
          invoice_id,
          service.service_id,
          quantity,
          unit_price,
          total_price
        ]
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
  request: Request,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const invoice_id = params.id;

    await client.query('DELETE FROM invoicedetail WHERE invoice_id = $1', [invoice_id]);
    
    const result = await client.query('DELETE FROM invoices WHERE invoice_id = $1 RETURNING invoice_id', [invoice_id]);
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    await client.query('COMMIT');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Invoice deleted successfully'
    });
    
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