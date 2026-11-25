"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const refresh = useCallback(async () => {
        try {
            const res = await fetch("/api/auth/me", { cache: "no-store" });
            const data = await res.json();
            if (data.authenticated && data.user) {
                setUser(data.user);
            }
            else {
                setUser(null);
            }
        }
        catch {
            setUser(null);
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    useEffect(() => {
        refresh();
    }, [refresh]);
    const login = async (email, password) => {
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                return { success: false, error: data.error || "Login failed" };
            }
            setUser(data.user);
            return { success: true };
        }
        catch {
            return { success: false, error: "Network error occurred during login." };
        }
    };
    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        }
        finally {
            setUser(null);
        }
    };
    return (<AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout,
            refresh,
        }}>
      {children}
    </AuthContext.Provider>);
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
