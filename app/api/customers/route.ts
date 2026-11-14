// app/api/customers/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch all customers and their current balance
export async function GET() {
  try {
    const customers = await db.customer.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(customers, { status: 200 });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

// POST: Add a new customer
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, address, currentBalance } = body;

    if (!name) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    const newCustomer = await db.customer.create({
      data: {
        name,
        phone: phone || null,
        address: address || null,
        currentBalance: parseFloat(currentBalance) || 0.0,
      },
    });

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}