// app/api/products/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch all products
export async function GET() {
  try {
    const products = await db.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST: Add a new product
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, unit, costPrice, sellingPrice, stockQuantity, minStockThreshold, barcode } = body;

    // Validation
    if (!name || sellingPrice === undefined) {
      return NextResponse.json({ error: "Product name and selling price are required" }, { status: 400 });
    }

    const newProduct = await db.product.create({
      data: {
        name,
        category: category || "General",
        unit: unit || "pcs",
        costPrice: parseFloat(costPrice) || 0,
        sellingPrice: parseFloat(sellingPrice),
        stockQuantity: parseFloat(stockQuantity) || 0,
        minStockThreshold: parseFloat(minStockThreshold) || 5,
        barcode: barcode || null,
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}