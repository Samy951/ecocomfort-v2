import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "hover" | "glass";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  variant = "default",
  padding = "md",
  children,
  className = "",
  ...props
}) => {
  const baseClasses = "rounded-2xl transition-all duration-200";

  const variantClasses = {
    default:
      "bg-main-white dark:bg-main-black border border-grey dark:border-dark-grey shadow-soft dark:shadow-medium",
    hover:
      "bg-main-white dark:bg-main-black border border-grey dark:border-dark-grey shadow-soft dark:shadow-medium hover:shadow-medium dark:hover:shadow-strong hover:-translate-y-1",
    glass:
      "bg-main-white/80 dark:bg-main-black/80 backdrop-blur-sm border border-grey/50 dark:border-dark-grey/50 shadow-soft",
  };

  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-4 sm:p-6",
    lg: "p-6 sm:p-8",
    xl: "p-8 sm:p-12",
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
