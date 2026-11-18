import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: saleId } = await params;
    const body = await request.json();
    const { itemId, returnQuantity } = body; // e.g., which sale item and how many quantities are returned

    const qtyToReturn = Number(returnQuantity);
    if (!qtyToReturn || qtyToReturn <= 0) {
      return NextResponse.json({ error: "Invalid return quantity" }, { status: 400 });
    }

    // 1. Fetch the sale item and its parent sale
    const saleItem = await db.saleItem.findUnique({
      where: { id: itemId },
      include: { product: true, sale: true },
    });

    if (!saleItem || saleItem.saleId !== saleId) {
      return NextResponse.json({ error: "Sale item not found" }, { status: 404 });
    }

    if (qtyToReturn > saleItem.quantity) {
      return NextResponse.json({ error: "Return quantity cannot exceed purchased quantity" }, { status: 400 });
    }

    // Calculate refund amount proportional to the returned quantity
    const unitPrice = saleItem.unitPrice;
    const refundAmount = unitPrice * qtyToReturn;

    // 2. Perform database updates in a transaction (Restock + Update Financials)
    await db.$transaction(async (tx) => {
      // A. Increase product stock back
      await tx.product.update({
        where: { id: saleItem.productId },
        data: {
          stockQuantity: {
            increment: qtyToReturn,
          },
        },
      });

      // B. Update the specific sale item quantity & total price (or reduce it)
      const newQuantity = saleItem.quantity - qtyToReturn;
      const newTotalPrice = saleItem.totalPrice - refundAmount;

      if (newQuantity === 0) {
        // If all items of this row are returned, delete or zero out the item
        await tx.saleItem.delete({
          where: { id: itemId },
        });
      } else {
        await tx.saleItem.update({
          where: { id: itemId },
          data: {
            quantity: newQuantity,
            totalPrice: newTotalPrice,
          },
        });
      }

      // C. Update the parent Sale totals (reduce grandTotal and dueAmount/paidAmount)
      const sale = saleItem.sale;
      const updatedGrandTotal = Math.max(0, sale.grandTotal - refundAmount);
      const updatedDueAmount = Math.max(0, sale.dueAmount - refundAmount);

      await tx.sale.update({
        where: { id: saleId },
        data: {
          grandTotal: updatedGrandTotal,
          dueAmount: updatedDueAmount,
        },
      });
    });

    return NextResponse.json({ success: true, message: "Product return processed successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error processing return:", error);
    return NextResponse.json({ error: "Failed to process return" }, { status: 500 });
  }
}