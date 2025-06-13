import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 },
      );
    }

    // For now, we'll use a simple approach to get location suggestions
    // In a full implementation, you'd want to add a dedicated geocoding endpoint to your FastAPI backend
    const response = await fetch(
      `${BACKEND_URL}/weather/${encodeURIComponent(query)}/2024-01-01`,
    );

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        formatted_address: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
      });
    } else {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 },
      );
    }
  } catch (error) {
    console.error("Error geocoding location:", error);
    return NextResponse.json(
      { error: "Failed to geocode location" },
      { status: 500 },
    );
  }
}
