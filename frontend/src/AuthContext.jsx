import React, { createContext, useContext, useState } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("clubverse_user");
    return saved ? JSON.parse(saved) : null;
  });

  function persist(token, user) {
    localStorage.setItem("clubverse_token", token);
    localStorage.setItem("clubverse_user", JSON.stringify(user));
    setUser(user);
  }

  async function login(email, password) {
    const { token, user } = await api.login(email, password);
    persist(token, user);
    return user;
  }

  async function signup(name, email, password) {
    const { token, user } = await api.signup(name, email, password);
    persist(token, user);
    return user;
  }

  function logout() {
    localStorage.removeItem("clubverse_token");
    localStorage.removeItem("clubverse_user");
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
