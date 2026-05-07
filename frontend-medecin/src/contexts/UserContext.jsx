import { createContext, useContext, useState } from "react";

const UserContext = createContext(null);

const FALLBACK = {
  id: 2, prenom: "Nordine", nom: "Bellouze",
  specialite: "Cardiologie", email: "", statut: "approuvé",
  rejection_reason: null,
};

function loadUser() {
  try {
    const stored = localStorage.getItem("medecin_user");
    return stored ? JSON.parse(stored) : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  const updateUser = (data) => {
    const merged = { ...user, ...data };
    localStorage.setItem("medecin_user", JSON.stringify(merged));
    setUser(merged);
  };

  return (
    <UserContext.Provider value={{ user, setUser: updateUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser doit être utilisé dans <UserProvider>");
  return ctx;
}

export function getInitiales(prenom = "", nom = "") {
  const p = prenom.trim().charAt(0).toUpperCase();
  const n = nom.trim().charAt(0).toUpperCase();
  return p + n || "?";
}
