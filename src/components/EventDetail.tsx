"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import {
  CalendarIcon,
  CloudRainIcon,
  CloudSunIcon,
  ThermometerIcon,
  WindIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from "lucide-react";

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
  [key: string]: string | number; // For any additional dynamic fields
}

interface AlternativeDate {
  date: string;
  suitability_score: number;
  suitability_details: SuitabilityDetail;
  weather_at_date: WeatherData;
}

interface EventDetailProps {
  event?: {
    id: number;
    name: string;
    type: string;
    location: string;
    event_date: string;
    weather_data?: WeatherData;
    suitability_score?: number;
    suitability_details?: SuitabilityDetail;
    alternative_dates?: AlternativeDate[];
  };
  eventId?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
}

const EventDetail = ({
  event,
  eventId,
  onEdit = () => console.log("Edit event"),
  onDelete = () => console.log("Delete event"),
  onBack = () => console.log("Back to dashboard"),
}: EventDetailProps) => {
  const [eventData, setEventData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("weather");

  useEffect(() => {
    if (event) {
      setEventData(event);
    } else if (eventId) {
      fetchEventDetails(eventId);
    }
  }, [event, eventId]);

  const fetchEventDetails = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch event details from Next.js API route
      const response = await fetch(`/api/events/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();

      if (result.success) {
        setEventData(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch event details");
      }
    } catch (err) {
      setError("Failed to fetch event details");
      console.error("Error fetching event details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-background p-4 md:p-6 rounded-xl w-full max-w-4xl mx-auto">
        <div className="text-center py-10">
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background p-4 md:p-6 rounded-xl w-full max-w-4xl mx-auto">
        <div className="text-center py-10">
          <p className="text-red-500">{error}</p>
          <Button onClick={onBack} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="bg-background p-4 md:p-6 rounded-xl w-full max-w-4xl mx-auto">
        <div className="text-center py-10">
          <p className="text-muted-foreground">No event data available</p>
          <Button onClick={onBack} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const {
    id,
    name,
    type,
    location,
    event_date,
    weather_data,
    suitability_score,
    suitability_details,
    alternative_dates,
  } = eventData;

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get weather icon URL from OpenWeatherMap
  const getWeatherIconUrl = (iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  // Determine suitability color based on score
  const getSuitabilityColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-blue-100 text-blue-800";
    if (score >= 40) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // Determine suitability text based on score
  const getSuitabilityText = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  return (
    <div className="bg-background p-4 md:p-6 rounded-xl w-full max-w-4xl mx-auto">
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">{name}</CardTitle>
              <CardDescription className="mt-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge variant="outline" className="capitalize">
                    {type}
                  </Badge>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    {formatDate(event_date)}
                  </span>
                  <span className="text-muted-foreground">{location}</span>
                </div>
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                Delete
              </Button>
            </div>
          </div>

          {suitability_score && (
            <div
              className={`mt-4 p-3 rounded-lg ${getSuitabilityColor(suitability_score)}`}
            >
              <div className="flex items-center gap-2">
                {suitability_score >= 60 ? (
                  <CheckCircleIcon className="h-5 w-5" />
                ) : (
                  <AlertCircleIcon className="h-5 w-5" />
                )}
                <span className="font-medium">
                  Weather Suitability: {getSuitabilityText(suitability_score)} (
                  {suitability_score}/100)
                </span>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="weather">Current Weather</TabsTrigger>
              <TabsTrigger value="suitability">Suitability Details</TabsTrigger>
              <TabsTrigger value="alternatives">Alternative Dates</TabsTrigger>
            </TabsList>

            <TabsContent value="weather" className="space-y-4">
              {weather_data ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center">
                      <img
                        src={getWeatherIconUrl(weather_data.weather_icon)}
                        alt={weather_data.weather_description}
                        className="w-24 h-24"
                      />
                      <div className="text-4xl font-bold">
                        {Math.round(weather_data.temperature)}°C
                      </div>
                    </div>
                    <div className="text-lg capitalize mt-2">
                      {weather_data.weather_description}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Feels like {Math.round(weather_data.feels_like)}°C
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <ThermometerIcon className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="text-sm font-medium">Temperature</div>
                        <div className="text-sm">
                          {Math.round(weather_data.min_temp)}°C -{" "}
                          {Math.round(weather_data.max_temp)}°C
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <CloudRainIcon className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-sm font-medium">Precipitation</div>
                        <div className="text-sm">
                          {Math.round(weather_data.rain_probability * 100)}%
                          chance
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <WindIcon className="h-5 w-5 text-cyan-500" />
                      <div>
                        <div className="text-sm font-medium">Wind</div>
                        <div className="text-sm">
                          {weather_data.wind_speed} m/s
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <CloudSunIcon className="h-5 w-5 text-yellow-500" />
                      <div>
                        <div className="text-sm font-medium">Clouds</div>
                        <div className="text-sm">{weather_data.clouds}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertTitle>No weather data available</AlertTitle>
                  <AlertDescription>
                    Weather information could not be loaded for this event date.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="suitability" className="space-y-4">
              {suitability_details ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Suitability Score
                      </CardTitle>
                      <CardDescription>
                        Breakdown of weather suitability for this event
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>Temperature</span>
                          <Badge variant="outline">
                            {suitability_details.temperature_score}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Precipitation</span>
                          <Badge variant="outline">
                            {suitability_details.precipitation_score}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Wind</span>
                          <Badge variant="outline">
                            {suitability_details.wind_score}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Sky Condition</span>
                          <Badge variant="outline">
                            {suitability_details.sky_score}
                          </Badge>
                        </div>

                        {/* Display any additional event-specific adjustments */}
                        {Object.entries(suitability_details).map(
                          ([key, value]) => {
                            if (
                              key.includes("adjustment") &&
                              typeof value === "string"
                            ) {
                              return (
                                <div
                                  key={key}
                                  className="flex justify-between items-center"
                                >
                                  <span className="capitalize">
                                    {key.replace("_", " ")}
                                  </span>
                                  <Badge variant="outline">{value}</Badge>
                                </div>
                              );
                            }
                            return null;
                          },
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <div className="w-full flex justify-between items-center">
                        <span className="font-medium">Final Score</span>
                        <Badge
                          className={getSuitabilityColor(suitability_score)}
                        >
                          {suitability_score}/100
                        </Badge>
                      </div>
                    </CardFooter>
                  </Card>

                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {suitability_score >= 80 ? (
                          <Alert className="bg-green-50 text-green-800 border-green-200">
                            <CheckCircleIcon className="h-4 w-4" />
                            <AlertTitle>Excellent Conditions</AlertTitle>
                            <AlertDescription>
                              Weather conditions are ideal for your {type}{" "}
                              event. No changes recommended.
                            </AlertDescription>
                          </Alert>
                        ) : suitability_score >= 60 ? (
                          <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                            <CheckCircleIcon className="h-4 w-4" />
                            <AlertTitle>Good Conditions</AlertTitle>
                            <AlertDescription>
                              Weather conditions are favorable for your {type}{" "}
                              event, but check the alternative dates for
                              potentially better options.
                            </AlertDescription>
                          </Alert>
                        ) : suitability_score >= 40 ? (
                          <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200">
                            <AlertCircleIcon className="h-4 w-4" />
                            <AlertTitle>Fair Conditions</AlertTitle>
                            <AlertDescription>
                              Weather conditions are acceptable but not ideal.
                              Consider checking alternative dates or preparing
                              contingency plans.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Alert className="bg-red-50 text-red-800 border-red-200">
                            <AlertCircleIcon className="h-4 w-4" />
                            <AlertTitle>Poor Conditions</AlertTitle>
                            <AlertDescription>
                              Weather conditions are not suitable for your{" "}
                              {type} event. Strongly consider rescheduling to an
                              alternative date.
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertTitle>No suitability data available</AlertTitle>
                  <AlertDescription>
                    Suitability information could not be calculated for this
                    event.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="alternatives" className="space-y-4">
              {alternative_dates && alternative_dates.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    Alternative Dates with Better Weather
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    {alternative_dates.map((alt, index) => (
                      <Card key={index} className="overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          <div
                            className={`p-4 md:w-1/4 flex flex-col items-center justify-center ${getSuitabilityColor(alt.suitability_score)}`}
                          >
                            <div className="text-2xl font-bold">
                              {alt.suitability_score}/100
                            </div>
                            <div className="text-sm font-medium">
                              {getSuitabilityText(alt.suitability_score)}
                            </div>
                            <div className="text-sm mt-2">
                              {formatDate(alt.date)}
                            </div>
                          </div>

                          <div className="p-4 md:w-3/4 bg-card">
                            <div className="flex items-center gap-4 mb-4">
                              <img
                                src={getWeatherIconUrl(
                                  alt.weather_at_date.weather_icon,
                                )}
                                alt={alt.weather_at_date.weather_description}
                                className="w-12 h-12"
                              />
                              <div>
                                <div className="text-lg font-medium">
                                  {Math.round(alt.weather_at_date.temperature)}
                                  °C, {alt.weather_at_date.weather_description}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Wind: {alt.weather_at_date.wind_speed} m/s |
                                  Rain:{" "}
                                  {Math.round(
                                    alt.weather_at_date.rain_probability * 100,
                                  )}
                                  % | Humidity: {alt.weather_at_date.humidity}%
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="font-medium">
                                  Temperature:
                                </span>{" "}
                                {alt.suitability_details.temperature_score}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Precipitation:
                                </span>{" "}
                                {alt.suitability_details.precipitation_score}
                              </div>
                              <div>
                                <span className="font-medium">Wind:</span>{" "}
                                {alt.suitability_details.wind_score}
                              </div>
                              <div>
                                <span className="font-medium">Sky:</span>{" "}
                                {alt.suitability_details.sky_score}
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-4"
                              onClick={() => {
                                // TODO: Implement reschedule functionality
                                console.log(`Reschedule to ${alt.date}`);
                              }}
                            >
                              Reschedule to this date
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertTitle>No alternative dates available</AlertTitle>
                  <AlertDescription>
                    No better alternative dates were found within the forecast
                    window.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventDetail;
