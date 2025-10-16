import React, { createContext, useContext, useState } from "react";
import PropTypes from "prop-types";

const EventContext = createContext();

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvent must be used within an EventProvider");
  }
  return context;
};

export const EventProvider = ({ children }) => {
  const [selectedEvent, setSelectedEvent] = useState("all");

  const handleEventChange = (eventId) => {
    setSelectedEvent(eventId);
  };

  return (
    <EventContext.Provider value={{ selectedEvent, handleEventChange }}>
      {children}
    </EventContext.Provider>
  );
};

EventProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
