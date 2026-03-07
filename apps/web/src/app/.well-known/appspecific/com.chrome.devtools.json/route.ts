import { NextResponse } from "next/server";

// Silence Chrome DevTools automatic request for this endpoint
export async function GET() {
  return NextResponse.json({}, { status: 200 });
}
