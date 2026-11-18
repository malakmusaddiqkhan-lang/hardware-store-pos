// app/api/sales/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// DELETE: Void/Delete a sale, restore inventory stock, and reverse Khataa balance
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: saleId } = await params;

    // 1. Find the sale along with its items
    const sale = await db.sale.findUnique({
      where: { id: saleId },
      include: { items: true },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // 2. Execute transaction to safely roll back stock and customer balance
    await db.$transaction(
      async (tx) => {
        // A. Restore product stock quantities back
        for (const item of sale.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                increment: item.quantity,
              },
            },
          });
        }

        // B. If a customer was assigned and there was a due amount added to Khataa, reverse it
        if (sale.customerId && sale.dueAmount > 0) {
          await tx.customer.update({
            where: { id: sale.customerId },
            data: {
              currentBalance: {
                decrement: sale.dueAmount,
              },
            },
          });
        }

        // C. Delete the sale record (Cascade will automatically remove its associated SaleItems)
        await tx.sale.delete({
          where: { id: saleId },
        });
      },
      {
        maxWait: 10000,
        timeout: 10000,
      }
    );

    return NextResponse.json(
      { success: true, message: "Sale deleted and inventory restored successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting sale:", error);
    return NextResponse.json({ error: "Failed to delete sale" }, { status: 500 });
  }
}