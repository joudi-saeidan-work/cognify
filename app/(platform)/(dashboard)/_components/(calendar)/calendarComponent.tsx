"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useEffect, useState, useRef, useMemo } from "react";
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
import { Board, Card, List } from "@prisma/client";
import { useEvents } from "./eventsContext";
import { useAction } from "@/hooks/use-actions";
import { createCard } from "@/actions/create-card";
import { toast } from "sonner";
import { deleteCard } from "@/actions/delete-card";
import { updateCard } from "@/actions/update-card";
import { Hint } from "@/components/hint";
const Calendar = ({ boardId }: { boardId: string }) => {
  const { state: currentEvents, dispatch } = useEvents();
  const [boards, setBoards] = useState<(Board & { lists: List[] })[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<string>("");
  const [selectedList, setSelectedList] = useState<string>("");

  // always default to the current board if possible
  const defaultBoard =
    (boards.find((board) => board.id === boardId) || boards[0]) ?? null;
  const defaultList = defaultBoard?.lists?.[0] ?? null;

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [newEventTitle, setNewEventTitle] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<DateSelectArg | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<
    "calendar" | "events" | "notifications"
  >("calendar");
  const calendarRef = useRef<FullCalendar | null>(null);

  // Add a function to fetch boards that can be called from multiple places
  const fetchBoards = async () => {
    try {
      const response = await fetch("/api/get-boards");
      if (!response.ok) throw new Error("Failed to fetch boards");
      const data = await response.json();
      setBoards(data);
      return data;
    } catch (error) {
      console.error("Error fetching boards:", error);
      return null;
    }
  };

  // Enhance loadEvents to have a parameter that prevents re-fetching boards
  const loadEvents = async (skipBoardFetch = false) => {
    try {
      // Only fetch boards if not skipped
      if (!skipBoardFetch) {
        await fetchBoards();
      }

      // Then fetch events as normal
      const response = await fetch(`/api/boards/${boardId}/cards`);
      if (!response.ok) throw new Error("Failed to fetch events");

      const cards = await response.json();
      const events = cards.map((card: Card) => {
        const dueDate = card.dueDate ? new Date(card.dueDate) : undefined;
        const start = card.start ? new Date(card.start) : undefined;
        const end = card.end ? new Date(card.end) : undefined;

        // Reset dueDate time to midnight
        if (dueDate) dueDate.setUTCHours(0, 0, 0, 0);

        // Find the list that contains this card
        const list = boards
          .find((board) => board.id === boardId)
          ?.lists.find((list) => list.id === card.listId);
        const listColor = list?.color || undefined;

        // Debug log to see what's happening
        console.log(
          "Card:",
          card.title,
          "ListId:",
          card.listId,
          "List:",
          list,
          "Color:",
          listColor
        );

        return {
          id: card.id,
          title: card.title,
          start: start || dueDate, // Use time-specific start if available
          end: end || dueDate, // Use time-specific end if available
          allDay: !card.start, // All-day if no start time specified
          backgroundColor: listColor, // Use list color instead of card color
          textColor: listColor ? "black" : undefined, // Set text to black when background color exists
          borderColor: listColor || "transparent", // Match border color to background or make it transparent
        };
      });

      // Update state with events
      dispatch({ type: "SET_EVENTS", payload: events });
    } catch (error) {
      console.error("Failed to load events:", error);
    }
  };

  // In the boards effect, pass true to skip board fetching
  useEffect(() => {
    if (boards.length > 0) {
      loadEvents(true); // Skip fetching boards since we already have them
    }
  }, [boardId, dispatch, boards]);

  // In interval, use normal loadEvents (will fetch boards)
  useEffect(() => {
    // Initial fetch
    fetchBoards();

    // Set up interval for auto-refresh (30 seconds)
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing boards and lists");
      loadEvents(); // This will fetch boards and then events
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (boards.length > 0 && !selectedBoard) {
      setSelectedBoard(defaultBoard?.id || boards[0].id);
    }
    if (defaultBoard?.lists?.length && !selectedList) {
      setSelectedList(defaultList?.id || defaultBoard.lists[0].id);
    }
  }, [boards]);

  const { execute: executeCreateCard } = useAction(createCard, {
    onSuccess: (data) => {
      toast.success(`Card "${data.title}" created`);
      dispatch({
        type: "UPDATE_EVENT",
        payload: {
          id: data.id,
          title: data.title,
          dueDate: data.dueDate?.toISOString(),
          start: data.start?.toISOString(),
          end: data.end?.toISOString(),
          allDay: !data.start,
          backgroundColor: data.color || undefined,
        },
      });
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const { execute: executeUpdateCard } = useAction(updateCard, {
    onSuccess: (data) => {
      toast.success(`Card "${data.title}" updated`);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const { execute: executeDeleteCard } = useAction(deleteCard, {
    onSuccess: (data) => {
      toast.success(`Card "${data.title}" deleted `);
      dispatch({ type: "DELETE_EVENT", payload: data.id });
    },
    onError: (error) => {
      toast.error(error);
    },
  });
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoard || !selectedList) {
      toast.error("Please select both a board and list");
      return;
    }

    const targetBoard = boards.find((b) => b.id === selectedBoard);
    const targetList = targetBoard?.lists?.find((l) => l.id === selectedList);

    if (!targetBoard || !targetList) {
      toast.error("Invalid board/list selection");
      return;
    }

    // Get dates from calendar selection
    const isAllDayEvent = selectedDate?.allDay; // this is true if the event is all day
    const start = selectedDate?.start ? selectedDate.start : undefined;
    const end = selectedDate?.end ? selectedDate.end : undefined;

    // Set dueDate to midnight UTC of the start date
    const dueDate = start ? new Date(start) : undefined;
    if (dueDate) dueDate.setUTCHours(0, 0, 0, 0);

    // For all-day events (month view), clear time components
    if (isAllDayEvent) {
      console.log("this is all day event");
      if (start) start.setUTCHours(0, 0, 0, 0);
      if (end) end.setUTCHours(0, 0, 0, 0);

      executeCreateCard({
        title: newEventTitle,
        boardId: targetBoard.id,
        listId: targetList.id,
        dueDate: dueDate,
        allDay: isAllDayEvent,
      });
    } else {
      // Update state with the returned card data
      console.log("this is not all day event");

      executeCreateCard({
        title: newEventTitle,
        boardId: targetBoard.id,
        listId: targetList.id,
        dueDate: dueDate,
        allDay: isAllDayEvent,
        start: start,
        end: end,
      });
    }
    handleCloseDialog();
  };

  // Close the dialog after the event is added
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setNewEventTitle(""); // Reset the event title
  };

  const handleEventClick = async (selected: EventClickArg) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${selected.event?.title}"?`
      )
    ) {
      try {
        const response = await executeDeleteCard({
          id: selected.event.id as string,
          boardId: boardId,
        });

        // Update state and local storage
      } catch (error) {
        console.error("Failed to delete card:", error);
      }
    }
  };

  const sortedEvents = useMemo(() => {
    return [...currentEvents].sort((a, b) => {
      const aStart =
        a.start instanceof Date
          ? a.start.getTime()
          : new Date(a.start as string).getTime();
      const bStart =
        b.start instanceof Date
          ? b.start.getTime()
          : new Date(b.start as string).getTime();
      return aStart - bStart;
    });
  }, [currentEvents]);

  // Open dialog when a date is selected
  const handleDateSelect = (selected: DateSelectArg) => {
    setSelectedDate(selected);
    console.log("selected", selected);
    setIsDialogOpen(true);
  };

  const handleEventChange = async (info: { event: EventApi }) => {
    // Get dates from calendar selection
    const isAllDayEvent = info.event.allDay; // this is true if the event is all day
    const start = info.event.start ? info.event.start : undefined;
    const end = info.event.end ? info.event.end : undefined;

    // Set dueDate to midnight UTC of the start date
    const dueDate = start ? new Date(start) : undefined;
    if (dueDate) dueDate.setUTCHours(0, 0, 0, 0);

    // For all-day events (month view), clear time components
    if (isAllDayEvent) {
      console.log("this is all day event");
      if (start) start.setUTCHours(0, 0, 0, 0);
      if (end) end.setUTCHours(0, 0, 0, 0);
      const newEvent = {
        id: info.event.id, // Add temporary ID
        title: info.event.title,
        dueDate: dueDate?.toISOString(),
        allDay: isAllDayEvent,
      };
      dispatch({ type: "UPDATE_EVENT", payload: newEvent });
      executeUpdateCard({
        id: info.event.id,
        title: info.event.title,
        boardId: boardId,
        dueDate: dueDate,
        allDay: isAllDayEvent,
      });
    } else {
      // Update state with the returned card data
      console.log("this is not all day event");
      dispatch({
        type: "UPDATE_EVENT",
        payload: {
          id: crypto.randomUUID(),
          title: newEventTitle,
          dueDate: dueDate?.toISOString(),
          start: start?.toISOString(),
          end: end?.toISOString(),
          allDay: isAllDayEvent,
          backgroundColor: undefined,
        },
      });
      executeUpdateCard({
        id: info.event.id,
        title: info.event.title,
        boardId: boardId,
        dueDate: dueDate,
        allDay: isAllDayEvent,
        start: start,
        end: end,
      });
    }
  };

  const handleRefreshClick = (ev: MouseEvent, element: HTMLElement) => {
    loadEvents(); // Call loadEvents with default parameter (false)
  };

  return (
    <div>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="gap-2"
            aria-label="Open Calendar"
          >
            <Hint description="Open Calendar">
              <span className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                View Calendar
              </span>
            </Hint>
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
                aria-label="Close Calendar"
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
                aria-label="Calendar View"
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
                aria-label="Events View"
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
                aria-label="Notifications View"
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
                      left: "prevButton,todayButton,nextButton,refreshButton",
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
                    events={currentEvents}
                    eventDrop={handleEventChange}
                    eventResize={handleEventChange}
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
                        hint: "Previous",
                      },
                      nextButton: {
                        text: ">",
                        click: () => {
                          const calendarApi = calendarRef.current?.getApi();
                          calendarApi?.next();
                        },
                        hint: "Next",
                      },
                      todayButton: {
                        text: "Today",
                        click: () => {
                          const calendarApi = calendarRef.current?.getApi();
                          calendarApi?.today();
                        },
                        hint: "Today",
                      },
                      refreshButton: {
                        text: "↻",
                        click: handleRefreshClick,
                        hint: "Refresh Calendar",
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
                    {sortedEvents.length <= 0 && (
                      <div className="italic text-center text-muted-foreground py-4">
                        No events scheduled
                      </div>
                    )}
                    {sortedEvents.map(({ id, title, start, end, allDay }) => (
                      <li
                        key={id}
                        className="group p-4 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer"
                        onClick={() =>
                          handleEventClick({
                            event: { id, title, start, end, allDay },
                          } as EventClickArg)
                        }
                      >
                        <p className="text-sm font-medium text-primary truncate">
                          {title}
                        </p>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(start!, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                          {!allDay && start && (
                            <span className="ml-2">
                              {(start instanceof Date
                                ? start
                                : new Date(start as string)
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {end &&
                                ` - ${(end instanceof Date
                                  ? end
                                  : new Date(end as string)
                                ).toLocaleTimeString([], {
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
        <DialogContent
          className="sm:max-w-md"
          aria-describedby="calendar-dialog-description"
        >
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Event</DialogTitle>
            <p id="calendar-dialog-description" className="sr-only">
              Create a new event to add to the calendar.
            </p>
          </DialogHeader>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <Input
              placeholder="Event title"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              className="text-lg py-5"
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={selectedBoard}
                onValueChange={(value) => setSelectedBoard(value)}
              >
                <SelectTrigger className="border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Select a Board" />
                </SelectTrigger>
                <SelectContent>
                  {boards.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedList}
                onValueChange={(value) => setSelectedList(value)}
                disabled={!selectedBoard}
              >
                <SelectTrigger className="border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue
                    placeholder={
                      selectedBoard &&
                      boards.find((b) => b.id === selectedBoard)?.lists
                        ?.length === 0
                        ? "No lists available"
                        : "Select a List"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const selectedBoardData = boards.find(
                      (b) => b.id === selectedBoard
                    );
                    if (!selectedBoardData?.lists?.length) {
                      return (
                        <SelectItem value="no-lists" disabled>
                          This board has no lists. Please create a list first.
                        </SelectItem>
                      );
                    }
                    return selectedBoardData.lists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.title}
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                aria-label="Cancel"
              >
                Cancel
              </Button>
              <Button type="submit" aria-label="Create Event">
                Create Event
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;
