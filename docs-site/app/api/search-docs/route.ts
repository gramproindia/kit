import { NextRequest, NextResponse } from "next/server";
import { searchDocs } from "@/lib/docs"; // Adjust path to your docs utility

// For App Router (app/api/search-docs/route.ts)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    const results = await searchDocs(query, 10);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
