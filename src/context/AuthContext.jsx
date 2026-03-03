// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // keeping separate for flexibility
  const [wallet, setWallet] = useState({ cash: 0, bonus: 0 });

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedWallet = localStorage.getItem("wallet");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }

    if (savedWallet) {
      try {
        const w = JSON.parse(savedWallet);
        setWallet({
          cash: Number(w?.cash ?? 0),
          bonus: Number(w?.bonus ?? 0),
        });
      } catch {
        setWallet({ cash: 0, bonus: 0 });
      }
    }
  }, []);

  const login = (userData, walletData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));

    if (walletData) {
      const next = {
        cash: Number(walletData?.cash ?? 0),
        bonus: Number(walletData?.bonus ?? 0),
      };
      setWallet(next);
      localStorage.setItem("wallet", JSON.stringify(next));
    }
   
  };

  const register = (userData, walletData) => login(userData, walletData);
  

  const logout = () => {
    setUser(null);
    setWallet({ cash: 0, bonus: 0 });
    localStorage.removeItem("user");
    localStorage.removeItem("wallet");
  };

  // ✅ supports partial updates too
  const updateWallet = (patchOrNext) => {
    setWallet((prev) => {
      const next =
        typeof patchOrNext === "function"
          ? patchOrNext(prev)
          : { ...prev, ...patchOrNext };

      const normalized = {
        cash: Number(next?.cash ?? 0),
        bonus: Number(next?.bonus ?? 0),
      };

      localStorage.setItem("wallet", JSON.stringify(normalized));
      return normalized;
    });
  };

  const value = useMemo(
    () => ({ user, wallet, login, register, logout, updateWallet }),
    [user, wallet]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
};
