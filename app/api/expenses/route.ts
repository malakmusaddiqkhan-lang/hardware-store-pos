// app/api/expenses/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch all store expenses
export async function GET() {
  try {
    const expenses = await db.expense.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(expenses, { status: 200 });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

// POST: Add a new store expense
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, category, amount, notes } = body;

    if (!title || !amount) {
      return NextResponse.json({ error: "Title and amount are required" }, { status: 400 });
    }

    const newExpense = await db.expense.create({
      data: {
        description: `${title} ${notes ? `(${notes})` : ""}`,
        category: category || "GENERAL",
        amount: parseFloat(amount),
        date: new Date(),
      },
    });

    return NextResponse.json(newExpense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}