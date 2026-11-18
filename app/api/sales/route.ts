// app/api/sales/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface CartItem {
  productId: string;
  quantity: number;
  costPrice?: number;
  sellingPrice: number;
}

// GET: Fetch all past sales
export async function GET() {
  try {
    const sales = await db.sale.findMany({
      include: { 
        customer: { select: { id: true, name: true, phone: true, currentBalance: true } }, 
        items: { include: { product: true } } 
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sales, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching sales:", error);
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
  }
}

// POST: Create a new sale / checkout
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, items, discount, tax, paidAmount, paymentMethod } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    if (paymentMethod === "KHAATA" && !customerId) {
      return NextResponse.json({ error: "Please select a customer for Khataa sales" }, { status: 400 });
    }

    // Calculate totals with explicit typing
    let subtotal = 0;
    const processedItems = items.map((item: CartItem) => {
      const totalPrice = item.sellingPrice * item.quantity;
      subtotal += totalPrice;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitCostPrice: item.costPrice || 0,
        unitPrice: item.sellingPrice,
        totalPrice,
      };
    });

    const disc = parseFloat(discount) || 0;
    const tx = parseFloat(tax) || 0;
    const grandTotal = subtotal - disc + tx;
    const paid = parseFloat(paidAmount) || 0;
    const dueAmount = Math.max(0, grandTotal - paid);
    
    let paymentStatus = "PAID";
    if (dueAmount > 0 && paid > 0) paymentStatus = "PARTIAL";
    if (dueAmount > 0 && paid === 0) paymentStatus = "UNPAID";

    // Generate Invoice Number (e.g. INV-17150000)
    const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;

    // Execute transaction with extended timeout to prevent P2028 cloud latency errors
    const result = await db.$transaction(
      async (txPrisma) => {
        // 1. Create the Sale record
        const sale = await txPrisma.sale.create({
          data: {
            invoiceNumber,
            customerId: customerId || null,
            subtotal,
            discount: disc,
            tax: tx,
            grandTotal,
            paidAmount: paid,
            dueAmount,
            paymentStatus,
            paymentMethod: paymentMethod || "CASH",
            items: {
              create: processedItems,
            },
          },
          include: { 
            customer: { select: { id: true, name: true, phone: true, currentBalance: true } }, 
            items: { include: { product: true } } 
          },
        });

        // 2. Deduct stock quantities from inventory
        for (const item of items) {
          await txPrisma.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }

        // 3. If customer is assigned
        if (customerId) {
          // If there's a due amount, increment their Khataa balance by the due portion
          if (dueAmount > 0) {
            await txPrisma.customer.update({
              where: { id: customerId },
              data: {
                currentBalance: {
                  increment: dueAmount,
                },
              },
            });
          }

          // If they paid spot cash during checkout, log it as an initial payment receipt/bill
          if (paid > 0 && paymentMethod === "KHAATA") {
            await txPrisma.customerPayment.create({
              data: {
                customerId: customerId,
                amount: paid,
                note: `Spot Cash Paid on Invoice #${invoiceNumber}`,
              },
            });
          }
        }

        return sale;
      },
      {
        maxWait: 10000, // default is 2000ms; wait up to 10s for a connection
        timeout: 10000, // allow up to 10s for transaction execution
      }
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("Error processing checkout:", error);
    return NextResponse.json({ error: "Failed to process checkout" }, { status: 500 });
  }
}