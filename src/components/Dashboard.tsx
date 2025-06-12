"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Bell, Calendar, Plus, RefreshCw } from "lucide-react";
import { Badge } from "../components/ui/badge";
import EventList from "./EventList";
import EventForm from "./EventForm";
import EventDetail from "./EventDetail";

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

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "alert" | "reminder" | "recommendation";
  timestamp: string;
  read: boolean;
}

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState("events");
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "Weather Alert",
      message: "Heavy rain expected for your Beach Party on Saturday",
      type: "alert",
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      id: 2,
      title: "Event Reminder",
      message: "Your Outdoor Concert is tomorrow",
      type: "reminder",
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      id: 3,
      title: "Better Weather Found",
      message: "Sunday would be a better day for your Picnic",
      type: "recommendation",
      timestamp: new Date().toISOString(),
      read: false,
    },
  ]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/events");
      const result = await response.json();

      if (result.success) {
        setEvents(result.data);
      } else {
        console.error("Failed to fetch events:", result.error);
        // Fallback to empty array
        setEvents([]);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
      // Fallback to empty array
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    setActiveTab("details");
  };

  const handleCreateEvent = async (
    eventData: Omit<
      Event,
      "id" | "latitude" | "longitude" | "weather_status" | "suitability_score"
    >,
  ) => {
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: eventData.name,
          type: eventData.type,
          location: eventData.location,
          event_date: eventData.event_date,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh events list
        await fetchEvents();
        setActiveTab("events");
      } else {
        console.error("Failed to create event:", result.error);
      }
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Weather-Aware Event Planning</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchEvents}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("notifications")}
            >
              <Bell className="h-4 w-4 mr-2" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            <Button onClick={() => setActiveTab("create")}>
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="events">
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="create">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </TabsTrigger>
            {selectedEvent && (
              <TabsTrigger value="details">Event Details</TabsTrigger>
            )}
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            <EventList
              events={events}
              isLoading={isLoading}
              onEventSelect={handleEventSelect}
            />
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create New Event</CardTitle>
              </CardHeader>
              <CardContent>
                <EventForm onSubmit={handleCreateEvent} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details">
            {selectedEvent && (
              <EventDetail
                event={selectedEvent}
                onBack={() => setActiveTab("events")}
              />
            )}
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Notifications</CardTitle>
                <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                  Mark all as read
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No notifications
                    </p>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border rounded-lg ${notification.read ? "bg-background" : "bg-muted"}`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{notification.title}</h3>
                          <Badge
                            variant={
                              notification.type === "alert"
                                ? "destructive"
                                : notification.type === "recommendation"
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {notification.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
