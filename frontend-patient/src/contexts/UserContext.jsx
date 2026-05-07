import { createContext, useContext, useState, useEffect } from "react";

export const UserContext = createContext();

// ✅ Mode développement — mettre false en production
const DEV_MODE = true;

const DEV_USER = {
  id: 71,
  nom: "Mansouri",
  prenom: "Ahmed",
  email: "ahmed.mansouri@email.com",
  tel: "0555443322",
};

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Prioriser les données de localStorage, même en mode dev
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Si parsing échoue, utiliser DEV_USER si en mode dev
        return DEV_MODE ? DEV_USER : null;
      }
    }
    return DEV_MODE ? DEV_USER : null;
  });

  useEffect(() => {
    // Vérifier localStorage au montage, même en mode dev
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        if (DEV_MODE) setUser(DEV_USER);
        else setUser(null);
      }
    } else if (DEV_MODE) {
      setUser(DEV_USER);
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "http://localhost:5173"; // Rediriger vers l'accueil
  };

  return (
    <UserContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

export default UserContext;
