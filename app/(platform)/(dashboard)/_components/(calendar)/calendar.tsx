"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useEffect, useState, useRef } from "react";
import {
  DateSelectArg,
  EventApi,
  EventClickArg,
  formatDate,
} from "@fullcalendar/core/index.js";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

const Calendar = () => {
  const [currentEvents, setCurrentEvent] = useState<EventApi[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [newEventTitle, setNewEventTitle] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<DateSelectArg | null>(null);
  const calendarRef = useRef<FullCalendar | null>(null);

  // Load events from local storage when the component is mounted
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEvents = localStorage.getItem("events");
      if (savedEvents) {
        setCurrentEvent(JSON.parse(savedEvents));
      }
    }
  }, []);

  // Save events to local storage when the current events change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("events", JSON.stringify(currentEvents));
    }
  }, [currentEvents]);

  // Open dialog when a date is selected
  const handleDateSelect = (selected: DateSelectArg) => {
    setSelectedDate(selected);
    setIsDialogOpen(true);
  };

  // Handle adding a new event
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page refresh
    if (selectedDate && newEventTitle) {
      const calendarApi = selectedDate.view.calendar; // Get the calendar API instance
      calendarApi.unselect(); // Clear any selected date/time

      // Create a new event
      const newEvent = {
        id: `${selectedDate?.start.toISOString()}-${newEventTitle}`, // Unique ID for the event
        title: newEventTitle,
        start: selectedDate?.start,
        end: selectedDate?.end,
        allDay: selectedDate?.allDay,
      };
      calendarApi.addEvent(newEvent);
      handleCloseDialog();
    }
  };

  // Close the dialog after the event is added
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setNewEventTitle(""); // Reset the event title
  };

  // Handle event click (delete event)
  const handleEventClick = (selected: EventClickArg) => {
    if (
      window.confirm(
        `Are you sure you want to delete this event? "${selected.event?.title}"?`
      )
    ) {
      selected.event.remove();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CalendarIcon className="h-4 w-4" />
          View Calendar
        </Button>
      </DialogTrigger>
      <DialogContent className="w-screen max-w-none h-screen max-h-none rounded-none overflow-y-auto sm:px-4 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-8 min-h-[80vh]">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="pb-6">
              <h2 className="text-2xl font-bold mb-6 text-primary">
                Calendar Events
              </h2>
              <ul className="space-y-3">
                {currentEvents.length <= 0 && (
                  <div className="italic text-center text-muted-foreground py-4">
                    No events scheduled
                  </div>
                )}
                {currentEvents.map((event: EventApi) => (
                  <li
                    key={event.id}
                    className="group p-4 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => handleEventClick({ event } as EventClickArg)}
                  >
                    <div className="font-medium text-primary">
                      {event.title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(event.start!, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Calendar */}
          <div className="lg:w-3/4 w-full min-h-[600px]">
            <FullCalendar
              ref={calendarRef}
              height="100%"
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              headerToolbar={{
                left: "prevButton,todayButton,nextButton",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              initialView="dayGridMonth"
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventsSet={(events) => setCurrentEvent(events)}
              initialEvents={
                typeof window !== "undefined"
                  ? JSON.parse(localStorage.getItem("events") || "[]")
                  : []
              }
              eventClassNames="cursor-pointer"
              dayHeaderClassNames="font-semibold"
              buttonIcons={false}
              themeSystem="standard"
              customButtons={{
                prevButton: {
                  text: "<",
                  click: () => {
                    const calendarApi = calendarRef.current?.getApi();
                    calendarApi?.prev();
                  },
                },
                nextButton: {
                  text: ">",
                  click: () => {
                    const calendarApi = calendarRef.current?.getApi();
                    calendarApi?.next();
                  },
                },
                todayButton: {
                  text: "Today",
                  click: () => {
                    const calendarApi = calendarRef.current?.getApi();
                    calendarApi?.today();
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Event Creation Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <DialogHeader>
              <DialogTitle className="text-xl">Create New Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <Input
                placeholder="Event title"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                className="text-lg py-5"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Event</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default Calendar;
