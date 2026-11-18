import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// DELETE: Delete a product by ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Product deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Cannot delete product linked to existing sales records" }, { status: 500 });
  }
}

// POST: Restock an existing product (adds to current quantity instead of duplicating)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { quantity, costPrice, sellingPrice } = body;

    const existingProduct = await db.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Add new restock quantity to the existing stock quantity
    const updatedProduct = await db.product.update({
      where: { id },
      data: {
        stockQuantity: existingProduct.stockQuantity + Number(quantity || 0),
        costPrice: costPrice !== undefined ? Number(costPrice) : existingProduct.costPrice,
        sellingPrice: sellingPrice !== undefined ? Number(sellingPrice) : existingProduct.sellingPrice,
      },
    });

    return NextResponse.json({ success: true, updatedProduct }, { status: 200 });
  } catch (error) {
    console.error("Error restocking product:", error);
    return NextResponse.json({ error: "Failed to restock product" }, { status: 500 });
  }
}