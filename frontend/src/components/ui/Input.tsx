import React from "react";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  variant?: "default" | "error";
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  iconPosition = "left",
  variant = "default",
  type = "text",
  className = "",
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [inputType, setInputType] = React.useState(type);

  React.useEffect(() => {
    if (type === "password") {
      setInputType(showPassword ? "text" : "password");
    } else {
      setInputType(type);
    }
  }, [type, showPassword]);

  const baseClasses =
    "w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2";

  const variantClasses = {
    default:
      "border-grey dark:border-dark-grey bg-main-white dark:bg-main-black text-main-black dark:text-main-white placeholder-medium-grey dark:placeholder-grey focus:ring-main-green/50 focus:border-main-green",
    error:
      "border-error bg-main-white dark:bg-main-black text-main-black dark:text-main-white placeholder-medium-grey dark:placeholder-grey focus:ring-error/50 focus:border-error",
  };

  const iconClasses = iconPosition === "left" ? "pl-10" : "pr-10";
  const passwordClasses = type === "password" ? "pr-20" : "";

  const inputClasses = `${baseClasses} ${variantClasses[variant]} ${iconClasses} ${passwordClasses} ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-paragraph-medium font-inter font-medium text-main-black dark:text-main-white mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        {icon && iconPosition === "left" && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medium-grey dark:text-grey">
            {icon}
          </div>
        )}

        <input type={inputType} className={inputClasses} {...props} />

        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-medium-grey dark:text-grey hover:text-main-black dark:hover:text-main-white transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}

        {icon && iconPosition === "right" && type !== "password" && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-medium-grey dark:text-grey">
            {icon}
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-paragraph-small text-error">{error}</p>}

      {helperText && !error && (
        <p className="mt-2 text-paragraph-small text-medium-grey dark:text-grey">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
