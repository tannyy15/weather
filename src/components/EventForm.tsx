"use client";

import React, { useState } from "react";
import { Calendar } from "../components/ui/calendar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

interface EventFormProps {
  onSubmit?: (eventData: EventData) => void;
  initialData?: EventData;
  isEditing?: boolean;
}

interface EventData {
  name: string;
  location: string;
  type: string;
  event_date: Date;
}

const eventTypes = [
  { value: "sports", label: "Sports" },
  { value: "wedding", label: "Wedding" },
  { value: "picnic", label: "Picnic" },
  { value: "concert", label: "Concert" },
  { value: "festival", label: "Festival" },
  { value: "conference", label: "Conference" },
  { value: "other", label: "Other" },
];

const EventForm: React.FC<EventFormProps> = ({
  onSubmit = () => {},
  initialData = {
    name: "",
    location: "",
    type: "",
    event_date: new Date(),
  },
  isEditing = false,
}) => {
  const [eventData, setEventData] = useState<EventData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleChange = (field: keyof EventData, value: string | Date) => {
    setEventData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = async (value: string) => {
    handleChange("location", value);

    // Real location search via backend Google Places API
    if (value.length > 2) {
      try {
        const response = await fetch(
          `/api/geocode?query=${encodeURIComponent(value)}`,
        );
        if (response.ok) {
          const result = await response.json();
          if (result.formatted_address) {
            setLocationSuggestions([result.formatted_address]);
            setShowSuggestions(true);
          }
        }
      } catch (error) {
        console.error("Error fetching location suggestions:", error);
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const selectLocation = (location: string) => {
    handleChange("location", location);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: eventData.name,
          type: eventData.type,
          location: eventData.location,
          event_date: eventData.event_date.toISOString().split("T")[0],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      const result = await response.json();
      if (result.success) {
        // Reset form after successful submission
        setEventData({
          name: "",
          location: "",
          type: "",
          event_date: new Date(),
        });
        onSubmit(result.data);
      } else {
        throw new Error(result.error || "Failed to create event");
      }
    } catch (error) {
      console.error("Error submitting event:", error);
      // You could add error state here to show user feedback
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-card">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Event" : "Create New Event"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Update your event details below"
            : "Fill in the details to create a new weather-aware event"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Event Name</Label>
            <Input
              id="name"
              placeholder="Enter event name"
              value={eventData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2 relative">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Search for a location"
              value={eventData.location}
              onChange={(e) => handleLocationChange(e.target.value)}
              required
            />
            {showSuggestions && locationSuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-background border rounded-md shadow-lg mt-1">
                {locationSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-accent cursor-pointer"
                    onClick={() => selectLocation(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Event Type</Label>
            <Select
              value={eventData.type || ""}
              onValueChange={(value) => handleChange("type", value)}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value || "unknown"}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Event Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !eventData.event_date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {eventData.event_date ? (
                    format(eventData.event_date, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={eventData.event_date}
                  onSelect={(date) => date && handleChange("event_date", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{isEditing ? "Update Event" : "Create Event"}</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EventForm;
