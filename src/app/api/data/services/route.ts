import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { servicename, description, unitprice, istaxed} = body;

        const query = `
            INSERT INTO services (
                servicename, 
                description, 
                unitprice, 
                istaxed
            )
            VALUES ($1, $2, $3, COALESCE($4, false))
            RETURNING *
        `;
        const values = [
            servicename, 
            description, 
            unitprice, 
            istaxed
        ];

        const result = await pool.query(query, values);
        return NextResponse.json({ service: result.rows[0] });
    } catch (err) {
        console.error('Error creating service:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const query = `
            SELECT 
                service_id, 
                servicename, 
                description, 
                unitprice, 
                COALESCE(istaxed, false) as istaxed
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
        const { service_id, description, unitprice, istaxed } = body;

        const query = `
            UPDATE services
            SET 
                description = $1, 
                unitprice = $2, 
                istaxed = COALESCE($3, false)
            WHERE service_id = $4
            RETURNING *
        `;
        const values = [
            description, 
            unitprice, 
            istaxed,
            service_id
        ];

        const result = await pool.query(query, values);
        return NextResponse.json({ service: result.rows[0] });
    } catch (err) {
        console.error('Error updating service:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}