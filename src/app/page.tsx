"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCw, Bell } from "lucide-react";
import Dashboard from "@/components/Dashboard";
import EventForm from "@/components/EventForm";
import EventDetail from "@/components/EventDetail";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEventSelect = (eventId: number) => {
    setSelectedEventId(eventId);
    setActiveTab("event-detail");
  };

  const handleCreateEvent = () => {
    setShowEventForm(true);
    setActiveTab("create-event");
  };

  const handleEventCreated = () => {
    setShowEventForm(false);
    setActiveTab("dashboard");
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleBackToDashboard = () => {
    setActiveTab("dashboard");
    setSelectedEventId(null);
    setShowEventForm(false);
  };

  return (
    <main className="flex min-h-screen flex-col p-6 bg-background">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Weather-Aware Event Planning</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid grid-cols-3 w-[400px] mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="create-event" disabled={!showEventForm}>
            Create Event
          </TabsTrigger>
          <TabsTrigger value="event-detail" disabled={!selectedEventId}>
            Event Detail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="flex-1">
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Events Dashboard</CardTitle>
                <CardDescription>
                  Manage your events and check weather conditions
                </CardDescription>
              </div>
              <Button onClick={handleCreateEvent}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </CardHeader>
            <CardContent>
              <Dashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create-event" className="flex-1">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Create New Event</CardTitle>
              <CardDescription>
                Fill in the details for your new event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventForm onSubmit={handleEventCreated} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="event-detail" className="flex-1">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>
                Weather information and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedEventId && (
                <EventDetail
                  eventId={selectedEventId}
                  onBack={handleBackToDashboard}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
