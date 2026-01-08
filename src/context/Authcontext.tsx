/* eslint-disable react-refresh/only-export-components */
import { createContext, useState } from "react";
import type { ReactNode } from "react";

// Optional: If using Firebase
// import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
// import { auth } from "../firebase";

export interface SignupData {
  email: string;
  phone: string;
  password: string;
}

export interface AuthContextType {
  user: { email: string; phone?: string } | null;
  login: (email: string, password: string) => void;
  logout: () => void;
  signup: (data: SignupData) => void;
  loginWithGoogle: () => void;
  signupWithGoogle?: () => void;  
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ email: string; phone?: string } | null>(null);

  const login = (email: string, password: string) => {
    console.log("Logging in", email, password);
    setUser({ email });
  };

  const logout = () => setUser(null);

  const signup = ({ email, phone, password }: SignupData) => {
    console.log("Signing up", { email, phone, password });
    setUser({ email, phone });
  };

  const loginWithGoogle = () => {
    console.log("Logging in with Google");
    // Example: If using Firebase, replace with real implementation
    // const provider = new GoogleAuthProvider();
    // signInWithPopup(auth, provider)
    //   .then(result => setUser({ email: result.user.email ?? "" }))
    //   .catch(err => console.error(err));

    // Temporary mock user for dev
    setUser({ email: "googleuser@example.com" });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};
