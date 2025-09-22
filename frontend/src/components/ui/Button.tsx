import React from "react";
import { ArrowRight, Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "big" | "medium" | "small" | "link";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "medium",
  loading = false,
  icon,
  iconPosition = "right",
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-inter font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-main-green/50 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses = {
    big: "h-btn-big px-6 py-3 rounded-xl text-link-big gap-3",
    medium: "h-btn-medium px-5 py-2.5 rounded-lg text-link-medium gap-2",
    small: "h-btn-small px-4 py-2 rounded-lg text-link-small gap-2",
    link: "h-btn-link px-0 py-0 text-link-big gap-2",
  };

  const variantClasses = {
    primary:
      "bg-main-green text-main-white hover:bg-emerald-70 active:bg-emerald-70",
    secondary:
      "bg-dark-green text-main-white hover:bg-main-black active:bg-main-black",
    outline:
      "bg-transparent border-2 border-main-white text-main-black dark:text-main-white hover:bg-main-black hover:text-main-white dark:hover:bg-main-white dark:hover:text-main-black active:bg-main-black active:text-main-white dark:active:bg-main-white dark:active:text-main-black",
    ghost:
      "bg-transparent text-main-black dark:text-main-white hover:bg-light-grey dark:hover:bg-dark-grey active:bg-light-grey dark:active:bg-dark-grey",
  };

  const iconElement =
    icon || (size !== "link" ? <ArrowRight className="w-4 h-4" /> : null);

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Chargement...</span>
        </>
      );
    }

    if (iconPosition === "left" && iconElement) {
      return (
        <>
          {iconElement}
          <span>{children}</span>
        </>
      );
    }

    if (iconPosition === "right" && iconElement) {
      return (
        <>
          <span>{children}</span>
          {iconElement}
        </>
      );
    }

    return children;
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {renderContent()}
    </button>
  );
};

export default Button;
