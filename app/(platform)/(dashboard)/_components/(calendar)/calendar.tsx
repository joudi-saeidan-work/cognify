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
  DialogTrigger,
} from "@/components/ui/dialog";

import { useEffect, useState, useRef, useMemo } from "react";
import {
  DateSelectArg,
  EventApi,
  EventClickArg,
  formatDate,
  EventInput,
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

  // Load events from local storage or API when component mounts
  useEffect(() => {
    const loadEvents = async () => {
      try {
        // Fetch events directly from the API
        const response = await fetch(`/api/boards/${boardId}/cards`);
        if (!response.ok) throw new Error("Failed to fetch events");

        const cards = await response.json();
        const events = cards.map((card: Card) => ({
          id: card.id,
          title: card.title,
          start: card.dueDate ? new Date(card.dueDate) : undefined,
          end: card.dueDate ? new Date(card.dueDate) : undefined,
          allDay: false,
          backgroundColor: card.color || undefined,
        }));

        // Update state with events
        dispatch({ type: "SET_EVENTS", payload: events });
      } catch (error) {
        console.error("Failed to load events:", error);
      }
    };

    loadEvents();
  }, [boardId, dispatch]);

  useEffect(() => {
    async function fetchBoards() {
      try {
        const response = await fetch("/api/get-boards");
        const data = await response.json();
        setBoards(data);
      } catch (error) {
        console.error("Error fetching boards:", error);
      }
    }
    fetchBoards();
  }, []);

  useEffect(() => {
    if (boards.length > 0 && !selectedBoard) {
      setSelectedBoard(defaultBoard?.id || boards[0].id);
    }
    if (defaultBoard?.lists?.length && !selectedList) {
      setSelectedList(defaultList?.id || defaultBoard.lists[0].id);
    }
  }, [boards]);

  // Modify handleAddEvent
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

    const dueDate = selectedDate?.start
      ? new Date(selectedDate.start)
      : undefined;

    // Optimistically update the state
    const newEvent = {
      id: crypto.randomUUID(), // Add temporary ID
      title: newEventTitle,
      listId: targetList.id,
      dueDate: dueDate?.toISOString(),
      allDay: true, // New events start as all-day
    };
    dispatch({ type: "ADD_EVENT", payload: newEvent });

    try {
      executeCreateCard({
        title: newEventTitle,
        boardId: targetBoard.id,
        listId: targetList.id,
        dueDate: dueDate,
      });

      // Update state with the returned card data
      dispatch({
        type: "UPDATE_EVENT",
        payload: {
          id: newEvent.id,
          title: newEventTitle,
          dueDate: dueDate?.toISOString(),
          start: dueDate?.toISOString(),
          end: dueDate?.toISOString(),
          allDay: true,
          backgroundColor: undefined,
        },
      });

      handleCloseDialog();
    } catch (error) {
      console.error("Failed to create event:", error);
      // Remove the temporary event
      if (newEvent.listId) {
        dispatch({ type: "DELETE_EVENT", payload: newEvent.listId });
      }
    }
  };

  // Close the dialog after the event is added
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setNewEventTitle(""); // Reset the event title
  };

  // Modify handleEventClick
  // (ToDo) we should also the delete the actual card from the database
  // need when we click on the event instead of deleting it it should show a popover
  // of the card details (title,list board, due date) and find another way to delete the card
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
                      left: "prevButton,todayButton,nextButton refresh",
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
                    // eventDrop={handleEventChange}
                    // eventResize={handleEventChange}
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
