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
import {
  CalendarIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  BellIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Calendar = () => {
  const [currentEvents, setCurrentEvent] = useState<EventApi[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [newEventTitle, setNewEventTitle] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<DateSelectArg | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<
    "calendar" | "events" | "notifications"
  >("calendar");
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

      // Create a new event with explicit start and end times
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
    <div>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            View Calendar
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-full max-w-8xl min-w-[90vw] h-[100dvh] p-6 overflow-y-auto"
          showClose={false}
        >
          {isSheetOpen && (
            <div
              className="hidden lg:flex fixed top-1/2 -translate-y-1/2 right-[calc(90vw-12px)] flex-col space-y-4"
              style={{ zIndex: 99999, pointerEvents: "auto" }}
            >
              <Button
                variant="ghost"
                onClick={() => setIsSheetOpen(false)}
                className="bg-background shadow-lg hover:bg-accent border relative z-[99999]"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveView("calendar")}
                className={`bg-background shadow-lg hover:bg-accent/80 border relative z-[99999] ${
                  activeView === "calendar"
                    ? "bg-slate-300 dark:bg-slate-700 border-slate-400 dark:border-slate-600"
                    : ""
                }`}
              >
                <CalendarIcon className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveView("events")}
                className={`bg-background shadow-lg hover:bg-accent/80 border relative z-[99999] ${
                  activeView === "events"
                    ? "bg-slate-300 dark:bg-slate-700 border-slate-400 dark:border-slate-600"
                    : ""
                }`}
              >
                <CheckCircleIcon className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveView("notifications")}
                className={`bg-background shadow-lg hover:bg-accent/80 border relative z-[99999] ${
                  activeView === "notifications"
                    ? "bg-slate-300 dark:bg-slate-700 border-slate-400 dark:border-slate-600"
                    : ""
                }`}
              >
                <BellIcon className="h-6 w-6" />
              </Button>
            </div>
          )}
          <div className="flex flex-col h-full">
            <div className="flex flex-1 flex-col lg:flex-row gap-8 min-h-0">
              {activeView === "calendar" && (
                <div className="flex-1 h-[calc(100dvh-4rem)] overflow-auto min-w-0">
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
                    dayMaxEvents={3}
                    select={handleDateSelect}
                    eventClick={handleEventClick}
                    eventsSet={(events) => setCurrentEvent(events)}
                    views={{
                      dayGridMonth: {
                        eventDisplay: "list-item",
                        displayEventEnd: false,
                        displayEventTime: true,
                        dayHeaderContent: (args) => {
                          return (
                            <div className="flex flex-col items-center">
                              <span className="text-xs uppercase text-muted-foreground">
                                {args.date.toLocaleDateString("en-US", {
                                  weekday: "short",
                                })}
                              </span>
                            </div>
                          );
                        },
                      },
                      timeGridWeek: {
                        eventDisplay: "block",
                        displayEventEnd: true,
                        displayEventTime: true,
                        displayEventStart: true,
                        dayHeaderContent: (args) => {
                          const isToday =
                            args.date.toDateString() ===
                            new Date().toDateString();
                          return (
                            <div className="flex flex-col items-center">
                              <span className="text-xs uppercase text-muted-foreground">
                                {args.date.toLocaleDateString("en-US", {
                                  weekday: "short",
                                })}
                              </span>
                              <span
                                className={`text-2xl flex items-center justify-center ${
                                  isToday
                                    ? "bg-blue-600 text-white rounded-full w-10 h-10"
                                    : ""
                                }`}
                              >
                                {args.date.getDate()}
                              </span>
                            </div>
                          );
                        },
                        slotDuration: "00:15:00",
                        snapDuration: "00:15:00",
                      },
                      timeGridDay: {
                        eventDisplay: "block",
                        displayEventEnd: true,
                        displayEventTime: true,
                        displayEventStart: true,
                        dayHeaderContent: (args) => {
                          const isToday =
                            args.date.toDateString() ===
                            new Date().toDateString();
                          return (
                            <div className="flex flex-col items-center">
                              <span className="text-xs uppercase text-muted-foreground">
                                {args.date.toLocaleDateString("en-US", {
                                  weekday: "short",
                                })}
                              </span>
                              <span
                                className={`text-2xl flex items-center justify-center ${
                                  isToday
                                    ? "bg-blue-600 text-white rounded-full w-10 h-10"
                                    : ""
                                }`}
                              >
                                {args.date.getDate()}
                              </span>
                            </div>
                          );
                        },
                        slotDuration: "00:15:00",
                        snapDuration: "00:15:00",
                      },
                    }}
                    slotEventOverlap={false}
                    eventTimeFormat={{
                      hour: "numeric",
                      minute: "2-digit",
                      meridiem: "short",
                    }}
                    initialEvents={
                      typeof window !== "undefined"
                        ? JSON.parse(localStorage.getItem("events") || "[]")
                        : []
                    }
                    eventClassNames="cursor-pointer text-sm font-medium"
                    dayHeaderClassNames="text-base font-semibold"
                    dayCellClassNames="text-lg"
                    titleFormat={{ month: "long", year: "numeric" }}
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
                    slotLabelInterval="01:00"
                    slotLabelFormat={{
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    }}
                  />
                </div>
              )}

              {activeView === "events" && (
                <div className="w-full">
                  <h2 className="text-2xl font-bold mb-6 text-primary">
                    Calendar Events
                  </h2>
                  <ul className="space-y-3">
                    {currentEvents.length <= 0 && (
                      <div className="italic text-center text-muted-foreground py-4">
                        No events scheduled
                      </div>
                    )}
                    {[...currentEvents]
                      .sort((a, b) => {
                        const aStart = a.start?.getTime() || 0;
                        const bStart = b.start?.getTime() || 0;
                        return aStart - bStart;
                      })
                      .map((event: EventApi) => (
                        <li
                          key={event.id}
                          className="group p-4 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer"
                          onClick={() =>
                            handleEventClick({ event } as EventClickArg)
                          }
                        >
                          <p className="text-sm font-medium text-primary truncate">
                            {event.title}
                          </p>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(event.start!, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                            {!event.allDay && event.start && (
                              <span className="ml-2">
                                {event.start.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {event.end &&
                                  ` - ${event.end.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}`}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {activeView === "notifications" && (
                <div className="w-full">
                  <h2 className="text-2xl font-bold mb-6 text-primary">
                    Notifications
                  </h2>
                  <div className="italic text-center text-muted-foreground py-4">
                    Notifications coming soon
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
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
    </div>
  );
};

export default Calendar;
