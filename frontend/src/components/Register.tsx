import React, { useState } from "react";
import { Mail, Lock, User, Building, Leaf, ArrowRight } from "lucide-react";
import { Button, Card, Input, Typography } from "./ui";
import apiService from "../services/api";
import type { User as UserType, AppError } from "../types";

interface RegisterProps {
  onRegisterSuccess: (token: string, user: UserType) => void;
  onSwitchToLogin: () => void;
}

export default function Register({
  onRegisterSuccess,
  onSwitchToLogin,
}: RegisterProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    organization_name: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.password !== formData.password_confirmation) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.register(
        formData.name,
        formData.email,
        formData.password,
        formData.password_confirmation,
        formData.organization_name
      );

      if (response.token && response.user) {
        apiService.setAuthToken(response.token);
        localStorage.setItem("user_data", JSON.stringify(response.user));

        onRegisterSuccess(response.token, response.user);
      } else {
        throw new Error("Réponse d'inscription invalide");
      }
    } catch (err: unknown) {
      const error = err as AppError;
      console.error("Register error:", err);
      setError(error.message || "Erreur d'inscription. Veuillez réessayer.");
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
              Créer un compte
            </Typography>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <Input
              type="text"
              name="name"
              label="Nom complet"
              value={formData.name}
              onChange={handleChange}
              placeholder="Votre nom complet"
              icon={<User className="w-5 h-5" />}
              disabled={isLoading}
              required
            />

            {/* Email Field */}
            <Input
              type="email"
              name="email"
              label="Email"
              value={formData.email}
              onChange={handleChange}
              placeholder="votre.email@exemple.com"
              icon={<Mail className="w-5 h-5" />}
              disabled={isLoading}
              required
            />

            {/* Organization Name Field */}
            <Input
              type="text"
              name="organization_name"
              label="Organisation"
              value={formData.organization_name}
              onChange={handleChange}
              placeholder="Nom de votre organisation"
              icon={<Building className="w-5 h-5" />}
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

            {/* Password Confirmation Field */}
            <Input
              type="password"
              name="password_confirmation"
              label="Confirmer le mot de passe"
              value={formData.password_confirmation}
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
              Créer le compte
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <Typography variant="paragraph-small" color="medium-grey">
              Déjà un compte ?{" "}
              <button
                onClick={onSwitchToLogin}
                className="text-main-green hover:text-emerald-70 font-bold transition-colors duration-200"
                disabled={isLoading}
              >
                Se connecter
              </button>
            </Typography>
          </div>

          {/* Password Requirements */}
          <div className="mt-6 pt-6 border-t border-grey dark:border-dark-grey">
            <Typography
              variant="paragraph-small"
              color="medium-grey"
              className="mb-2"
            >
              📋 Exigences du mot de passe :
            </Typography>
            <ul className="space-y-1">
              <li>
                <Typography variant="paragraph-tiny" color="grey">
                  • Au moins 8 caractères
                </Typography>
              </li>
              <li>
                <Typography variant="paragraph-tiny" color="grey">
                  • Utilisez un mot de passe sécurisé
                </Typography>
              </li>
              <li>
                <Typography variant="paragraph-tiny" color="grey">
                  • Les deux mots de passe doivent correspondre
                </Typography>
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
