"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { EventInput } from "@fullcalendar/core";

// a way to access state from different components
type EventsState = EventInput[]; // an array of events

type Action =
  | { type: "SET_EVENTS"; payload: EventsState }
  | { type: "ADD_EVENT"; payload: EventInput }
  | { type: "UPDATE_EVENT"; payload: EventInput }
  | { type: "DELETE_EVENT"; payload: string };

const EventsContext = createContext<
  | {
      state: EventsState;
      dispatch: React.Dispatch<Action>;
    }
  | undefined
>(undefined);

// returns a new state based on the action -> normally takes two arguments: the current state and the action
const eventsReducer = (state: EventsState, action: Action): EventsState => {
  switch (action.type) {
    case "SET_EVENTS":
      return action.payload; // replaces the state with the new events
    case "ADD_EVENT":
      return [...state, action.payload]; // adds a new event to the state
    case "UPDATE_EVENT":
      return state.map((event) =>
        event.id === action.payload.id ? action.payload : event
      ); // updates an existing event in the state by matching the id
    case "DELETE_EVENT":
      return state.filter((event) => event.id !== action.payload); // removes an event from the state by matching the id
    default:
      return state;
  }
};

// useReducer always gets called with 2 arguments: a reducer function & an initial state
// the useReduces hook returns an array with two values: the current state & the dispatch function
export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(eventsReducer, []); // initial state is an empty array
  return (
    <EventsContext.Provider value={{ state, dispatch }}>
      {children}
    </EventsContext.Provider>
  );
};

interface EventsContextType {
  state: EventsState;
  dispatch: React.Dispatch<Action>;
}

export const useEvents = (): EventsContextType => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error("useEvents must be used within an EventsProvider");
  }
  return context;
};
