// app/api/customers/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch complete customer details, payment receipts, and itemized sales history
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
        },
        sales: {
          orderBy: { createdAt: "desc" },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(customer, { status: 200 });
  } catch (error) {
    console.error("Error fetching customer ledger:", error);
    return NextResponse.json({ error: "Failed to fetch customer details" }, { status: 500 });
  }
}

// PATCH: Receive a partial or full Khaata payment and log payment bill receipt
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await request.json();
    const paymentAmount = parseFloat(body.amount);
    const note = body.note || "Khaata Payment Received";

    if (!id) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json({ error: "Enter a valid payment amount" }, { status: 400 });
    }

    const customer = await db.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Prevent negative balance if they overpay slightly, or deduct cleanly
    const newBalance = Math.max(0, customer.currentBalance - paymentAmount);

    // Update customer balance and create a payment receipt record atomically
    const [updatedCustomer, paymentRecord] = await db.$transaction([
      db.customer.update({
        where: { id },
        data: {
          currentBalance: newBalance,
        },
      }),
      db.customerPayment.create({
        data: {
          customerId: id,
          amount: paymentAmount,
          note: note,
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        customer: updatedCustomer,
        payment: paymentRecord,
        paid: paymentAmount,
        remainingBalance: newBalance,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error recording Khaata payment:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}

// DELETE: Remove a customer and unlink related sales & payments
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    // Set customerId to null on their past sales to protect sales history
    await db.sale.updateMany({
      where: { customerId: id },
      data: { customerId: null },
    });

    // Delete associated payment records
    await db.customerPayment.deleteMany({
      where: { customerId: id },
    });

    // Delete the customer
    await db.customer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}