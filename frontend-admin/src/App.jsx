import React, { useState, useEffect } from "react";
import AdminDashboard from "./components/AdminDashboard";
import Login from "./components/Login";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("admin_token"));

  useEffect(() => {
    const onStorage = () => setToken(localStorage.getItem("admin_token"));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!token) {
    return <Login onLogin={() => setToken(localStorage.getItem("admin_token"))} />;
  }

  return <AdminDashboard />;
}

export default App;