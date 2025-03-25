import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { servicename, description, unitprice, istaxed, isparts } = body;

        const query = `
            INSERT INTO services (
                servicename, 
                description, 
                unitprice, 
                istaxed,
                isparts
            )
            VALUES ($1, $2, $3, COALESCE($4, false), COALESCE($5, false))
            RETURNING *
        `;
        const values = [
            servicename, 
            description, 
            unitprice, 
            istaxed,
            isparts
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
                COALESCE(istaxed, false) as istaxed,
                COALESCE(isparts, false) as isparts
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
        const { service_id, description, unitprice, istaxed, isparts } = body;

        const query = `
            UPDATE services
            SET 
                description = $1, 
                unitprice = $2, 
                istaxed = COALESCE($3, false),
                isparts = COALESCE($4, false)
            WHERE service_id = $5
            RETURNING *
        `;
        const values = [
            description, 
            unitprice, 
            istaxed,
            isparts,
            service_id
        ];

        const result = await pool.query(query, values);
        return NextResponse.json({ service: result.rows[0] });
    } catch (err) {
        console.error('Error updating service:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}