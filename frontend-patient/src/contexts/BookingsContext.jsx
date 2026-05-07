import { createContext, useContext, useState } from "react";

export const BookingsContext = createContext();

export function BookingsProvider({ children }) {
  const [bookings, setBookings] = useState([]);

  const addBooking = (booking) => {
    setBookings((prev) => [...prev, { id: Date.now(), ...booking }]);
  };

  const removeBooking = (id) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  // ✅ Fonctions manquantes ajoutées
  const getUpcoming = () => {
    const now = new Date();
    return bookings.filter((b) => new Date(b.date) >= now);
  };

  const getPast = () => {
    const now = new Date();
    return bookings.filter((b) => new Date(b.date) < now);
  };

  const cancelBooking = (id) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <BookingsContext.Provider
      value={{
        bookings,
        addBooking,
        removeBooking,
        setBookings,
        getUpcoming, // ✅
        getPast, // ✅
        cancelBooking, // ✅
      }}
    >
      {children}
    </BookingsContext.Provider>
  );
}

export function useBookings() {
  return useContext(BookingsContext);
}

export default BookingsContext;
