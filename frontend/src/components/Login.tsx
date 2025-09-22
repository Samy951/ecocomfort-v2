import React, { useState } from "react";
import { Mail, Lock, Leaf, ArrowRight } from "lucide-react";
import { Button, Card, Input, Typography } from "./ui";
import apiService from "../services/api";

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
  onSwitchToRegister: () => void;
}

export default function Login({
  onLoginSuccess,
  onSwitchToRegister,
}: LoginProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeStoreUser = (user: any) => {
    try {
      if (typeof window !== "undefined" && "localStorage" in window) {
        const { id, name, email } = user || {};
        localStorage.setItem("user_data", JSON.stringify({ id, name, email }));
      }
    } catch {
      // ignore storage errors
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.login(
        formData.email,
        formData.password
      );

      if (response.token && response.user) {
        apiService.setAuthToken(response.token);
        safeStoreUser(response.user);
        onLoginSuccess(response.token, response.user);
      } else {
        throw new Error("Réponse d'authentification invalide");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        err.message || "Erreur de connexion. Vérifiez vos identifiants."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError(null);
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.login(
        "admin@ecocomfort.com",
        "Admin@123"
      );

      if (response.token && response.user) {
        apiService.setAuthToken(response.token);
        safeStoreUser(response.user);
        onLoginSuccess(response.token, response.user);
      } else {
        throw new Error("Réponse d'authentification invalide");
      }
    } catch (err: any) {
      console.error("Demo login error:", err);
      setError(
        err.message || "Erreur de connexion admin. Vérifiez les credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-main-white dark:bg-main-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card variant="glass" padding="xl" className="w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-main-green rounded-full flex items-center justify-center">
                <Leaf className="w-6 h-6 text-main-white" />
              </div>
            </div>
            <Typography variant="h2" className="mb-2">
              EcoComfort
            </Typography>
            <Typography variant="paragraph-medium" color="medium-grey">
              Système IoT de Gestion Énergétique
            </Typography>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <Input
              type="email"
              name="email"
              label="Email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@ecocomfort.com"
              icon={<Mail className="w-5 h-5" />}
              disabled={isLoading}
              required
            />

            {/* Password Field */}
            <Input
              type="password"
              name="password"
              label="Mot de passe"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5" />}
              disabled={isLoading}
              required
            />

            {/* Error Message */}
            {error && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-3">
                <Typography variant="paragraph-small" color="error">
                  {error}
                </Typography>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="big"
              loading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
              className="w-full"
              disabled={isLoading}
            >
              Se connecter
            </Button>

            {/* Demo Login Button */}
            <Button
              type="button"
              variant="secondary"
              size="medium"
              onClick={handleDemoLogin}
              className="w-full"
              disabled={isLoading}
            >
              🚀 Connexion Admin Demo
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <Typography variant="paragraph-small" color="medium-grey">
              Pas encore de compte ?{" "}
              <button
                onClick={onSwitchToRegister}
                className="text-main-green hover:text-emerald-70 font-bold transition-colors duration-200"
                disabled={isLoading}
              >
                S'inscrire
              </button>
            </Typography>
          </div>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-grey dark:border-dark-grey text-center">
            <Typography
              variant="paragraph-small"
              color="medium-grey"
              className="mb-2"
            >
              💡 Comptes de test disponibles
            </Typography>
            <div className="space-y-1">
              <Typography variant="paragraph-tiny" color="grey">
                Admin: admin@ecocomfort.com
              </Typography>
              <Typography variant="paragraph-tiny" color="grey">
                Manager: manager@ecocomfort.com
              </Typography>
              <Typography variant="paragraph-tiny" color="grey">
                User: user@ecocomfort.com
              </Typography>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
