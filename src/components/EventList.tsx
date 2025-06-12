"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Calendar,
  CalendarIcon,
  Filter,
  Grid,
  List,
  Search,
  SunMoon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Calendar as CalendarComponent } from "../components/ui/calendar";
import { format } from "date-fns";

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

interface EventListProps {
  events?: Event[];
  onEventSelect?: (event: Event) => void;
  onCreateEvent?: () => void;
  isLoading?: boolean;
}

const EventList = ({
  events = [],
  onEventSelect = () => {},
  onCreateEvent = () => {},
  isLoading = false,
}: EventListProps) => {
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(events);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("date");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Mock event types for the filter dropdown
  const eventTypes = [
    "sports",
    "wedding",
    "picnic",
    "concert",
    "conference",
    "party",
  ];

  useEffect(() => {
    if (!events || events.length === 0) {
      setFilteredEvents([]);
      return;
    }

    // Filter events based on search term, event type, and date
    let filtered = [...events];

    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (eventTypeFilter) {
      filtered = filtered.filter(
        (event) => event.type.toLowerCase() === eventTypeFilter.toLowerCase(),
      );
    }

    if (selectedDate) {
      filtered = filtered.filter(
        (event) =>
          format(new Date(event.event_date), "yyyy-MM-dd") ===
          format(selectedDate, "yyyy-MM-dd"),
      );
    }

    // Sort events
    if (sortBy === "date") {
      filtered.sort(
        (a, b) =>
          new Date(a.event_date).getTime() - new Date(b.event_date).getTime(),
      );
    } else if (sortBy === "score") {
      filtered.sort(
        (a, b) => (b.suitability_score || 0) - (a.suitability_score || 0),
      );
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, eventTypeFilter, sortBy, selectedDate]);

  const getSuitabilityColor = (score?: number) => {
    if (!score) return "bg-gray-200";
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-green-300";
    if (score >= 40) return "bg-yellow-400";
    return "bg-red-500";
  };

  const getWeatherStatusBadge = (status?: string) => {
    if (
      !status ||
      status === "N/A" ||
      status.includes("Error") ||
      status === "Forecast Unavailable"
    ) {
      return <Badge variant="outline">No Data</Badge>;
    }

    switch (status) {
      case "Excellent":
        return <Badge className="bg-green-500">Excellent</Badge>;
      case "Good":
        return <Badge className="bg-green-300">Good</Badge>;
      case "Fair":
        return <Badge className="bg-yellow-400">Fair</Badge>;
      case "Poor":
        return <Badge className="bg-red-500">Poor</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setEventTypeFilter(null);
    setSelectedDate(undefined);
    setSortBy("date");
  };

  return (
    <div className="bg-background w-full p-4 rounded-lg">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Events</h2>
          <Button onClick={onCreateEvent}>Create Event</Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Event Type Filter */}
          <Select
            value={eventTypeFilter || "all"}
            onValueChange={(value) =>
              setEventTypeFilter(value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {eventTypes.map((type) => (
                <SelectItem key={type} value={type || "unknown"}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[180px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="score">Weather Score</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 border rounded-md">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>

          {/* Reset Filters */}
          <Button
            variant="outline"
            onClick={resetFilters}
            className="whitespace-nowrap"
          >
            <Filter className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>

        {/* Events Display */}
        {isLoading ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">
              No events found. Try adjusting your filters or create a new event.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {filteredEvents.map((event) => (
              <Card
                key={event.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                    {getWeatherStatusBadge(event.weather_status)}
                  </div>
                  <CardDescription>
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{format(new Date(event.event_date), "PPP")}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{event.location}</span>
                    </div>
                    {event.suitability_score !== undefined && (
                      <div className="flex items-center mt-2">
                        <SunMoon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${getSuitabilityColor(event.suitability_score)}`}
                            style={{ width: `${event.suitability_score}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm font-medium">
                          {event.suitability_score}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => onEventSelect(event)}
                  >
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            {filteredEvents.map((event) => (
              <Card
                key={event.id}
                className="mb-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center p-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium">{event.name}</h3>
                      <Badge variant="outline">{event.type}</Badge>
                      {getWeatherStatusBadge(event.weather_status)}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {event.location}
                    </div>
                    <div className="text-sm">
                      {format(new Date(event.event_date), "PPP")}
                    </div>
                  </div>

                  {event.suitability_score !== undefined && (
                    <div className="flex items-center mt-2 md:mt-0 md:w-1/4">
                      <SunMoon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${getSuitabilityColor(event.suitability_score)}`}
                          style={{ width: `${event.suitability_score}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm font-medium">
                        {event.suitability_score}
                      </span>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="mt-2 md:mt-0 md:ml-4"
                    onClick={() => onEventSelect(event)}
                  >
                    View
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventList;
