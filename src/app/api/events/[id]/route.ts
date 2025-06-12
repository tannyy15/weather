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

// Mock event details - in production, this would come from a database and weather API
const mockEventDetails: Record<number, EventDetail> = {
  1: {
    id: 1,
    name: "Beach Party",
    type: "party",
    location: "Miami Beach, FL",
    event_date: "2023-07-15",
    weather_data: {
      temperature: 28.5,
      feels_like: 30.2,
      min_temp: 26.8,
      max_temp: 31.4,
      pressure: 1012,
      humidity: 65,
      wind_speed: 3.5,
      wind_deg: 120,
      clouds: 20,
      weather_main: "Clear",
      weather_description: "clear sky",
      weather_icon: "01d",
      rain_probability: 0.1,
      rain_volume_1h: 0,
      rain_volume_3h: 0,
      dt_txt: "2023-07-15 12:00:00",
    },
    suitability_score: 85,
    suitability_details: {
      temperature_score: "+30 (Ideal)",
      precipitation_score: "+25 (Low Rain Risk)",
      wind_score: "+20 (Low Wind)",
      sky_score: "+25 (Clear/Cloudy)",
      final_score_raw: 85,
      final_score_normalized: 85,
    },
    alternative_dates: [
      {
        date: "2023-07-16",
        suitability_score: 90,
        suitability_details: {
          temperature_score: "+30 (Ideal)",
          precipitation_score: "+25 (Low Rain Risk)",
          wind_score: "+20 (Low Wind)",
          sky_score: "+25 (Clear/Cloudy)",
          final_score_raw: 90,
          final_score_normalized: 90,
        },
        weather_at_date: {
          temperature: 27.8,
          feels_like: 29.5,
          min_temp: 26.0,
          max_temp: 30.2,
          pressure: 1014,
          humidity: 60,
          wind_speed: 2.8,
          wind_deg: 110,
          clouds: 10,
          weather_main: "Clear",
          weather_description: "clear sky",
          weather_icon: "01d",
          rain_probability: 0.05,
          rain_volume_1h: 0,
          rain_volume_3h: 0,
          dt_txt: "2023-07-16 12:00:00",
        },
      },
    ],
  },
};

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

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const eventDetail = mockEventDetails[id];

    if (!eventDetail) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

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
