import { NextRequest, NextResponse } from "next/server";

interface WeatherData {
  temperature: number;
  feels_like: number;
  min_temp: number;
  max_temp: number;
  pressure: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  clouds: number;
  weather_main: string;
  weather_description: string;
  weather_icon: string;
  rain_probability: number;
  rain_volume_1h: number;
  rain_volume_3h: number;
  dt_txt: string;
}

interface SuitabilityDetail {
  temperature_score: string;
  precipitation_score: string;
  wind_score: string;
  sky_score: string;
  final_score_raw: number;
  final_score_normalized: number;
}

interface AlternativeDate {
  date: string;
  suitability_score: number;
  suitability_details: SuitabilityDetail;
  weather_at_date: WeatherData;
}

interface EventDetail {
  id: number;
  name: string;
  type: string;
  location: string;
  event_date: string;
  weather_data?: WeatherData;
  suitability_score?: number;
  suitability_details?: SuitabilityDetail;
  alternative_dates?: AlternativeDate[];
}

// Proxy to FastAPI backend
const BACKEND_URL = "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid event ID" },
        { status: 400 },
      );
    }

    // Fetch suitability data from FastAPI backend
    const response = await fetch(`${BACKEND_URL}/events/${id}/suitability`);

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: "Event not found" },
          { status: 404 },
        );
      }
      throw new Error(`Backend error: ${response.status}`);
    }

    const suitabilityData = await response.json();

    // Fetch alternative dates
    let alternativeDates = [];
    try {
      const altResponse = await fetch(
        `${BACKEND_URL}/events/${id}/alternatives`,
      );
      if (altResponse.ok) {
        alternativeDates = await altResponse.json();
      }
    } catch (altError) {
      console.warn("Could not fetch alternative dates:", altError);
    }

    // Transform backend data to match frontend expectations
    const eventDetail = {
      id: suitabilityData.event_id,
      name: suitabilityData.event_name,
      type: suitabilityData.event_type,
      location: suitabilityData.location,
      event_date: suitabilityData.event_date,
      weather_data: suitabilityData.weather_at_event_time,
      suitability_score: suitabilityData.suitability_score,
      suitability_details: suitabilityData.suitability_details,
      alternative_dates: alternativeDates,
    };

    return NextResponse.json({
      success: true,
      data: eventDetail,
    });
  } catch (error) {
    console.error("Error fetching event details:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch event details" },
      { status: 500 },
    );
  }
}
