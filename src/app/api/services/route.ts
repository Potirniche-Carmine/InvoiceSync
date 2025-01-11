import { NextResponse } from "next/server";
import { pool } from "@/app/lib/db";

export async function GET() {
    try{
        const query = `
            SELECT service_id, servicename, description, unitprice
            FROM services
            ORDER BY servicename
        `;

        const result = await pool.query(query);
        return NextResponse.json({ services: result.rows });
    } catch (err) {
        console.error('Error fetching services:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { service_id, description, unitprice } = body;

        const query = `
            UPDATE services
            SET description = $1, unit_price = $2,
            WHERE service_id = $3
            RETURNING *
        `;
        const values = [ description, unitprice, service_id ];

        const result = await pool.query(query, values);
        return NextResponse.json({ service:result.rows[0] });
    } catch (err) {
        console.error('Error updating service', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}