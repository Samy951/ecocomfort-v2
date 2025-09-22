import React, { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import type { User } from "../types";

interface AuthWrapperProps {
  onAuthSuccess: (token: string, user: User) => void;
}

export default function AuthWrapper({ onAuthSuccess }: AuthWrapperProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);

  const handleLoginSuccess = (token: string, user: User) => {
    onAuthSuccess(token, user);
  };

  const handleRegisterSuccess = (token: string, user: User) => {
    onAuthSuccess(token, user);
  };

  return (
    <>
      {isLoginMode ? (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setIsLoginMode(false)}
        />
      ) : (
        <Register
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => setIsLoginMode(true)}
        />
      )}
    </>
  );
}
