import { NextRequest, NextResponse } from "next/server";

interface Event {
  id: number;
  name: string;
  type: string;
  location: string;
  latitude: number;
  longitude: number;
  event_date: string;
  weather_status?: string;
  suitability_score?: number;
}

// Mock database - in production, this would be a real database
let events: Event[] = [
  {
    id: 1,
    name: "Beach Party",
    type: "party",
    location: "Miami Beach, FL",
    latitude: 25.7907,
    longitude: -80.13,
    event_date: "2023-07-15",
    weather_status: "Excellent",
    suitability_score: 85,
  },
  {
    id: 2,
    name: "Outdoor Concert",
    type: "concert",
    location: "Central Park, NY",
    latitude: 40.7829,
    longitude: -73.9654,
    event_date: "2023-07-20",
    weather_status: "Good",
    suitability_score: 75,
  },
  {
    id: 3,
    name: "Picnic",
    type: "picnic",
    location: "Golden Gate Park, SF",
    latitude: 37.7694,
    longitude: -122.4862,
    event_date: "2023-07-25",
    weather_status: "Poor",
    suitability_score: 35,
  },
];

export async function GET() {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, location, event_date } = body;

    if (!name || !type || !location || !event_date) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create new event
    const newEvent: Event = {
      id: Math.max(...events.map((e) => e.id), 0) + 1,
      name,
      type,
      location,
      event_date,
      latitude: 0, // In production, geocode the location
      longitude: 0,
      weather_status: "Pending",
      suitability_score: Math.floor(Math.random() * 100), // Mock score
    };

    events.push(newEvent);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      data: newEvent,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create event" },
      { status: 500 },
    );
  }
}
