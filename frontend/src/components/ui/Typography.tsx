import React from "react";

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?:
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "paragraph-big"
    | "paragraph-medium"
    | "paragraph-small"
    | "paragraph-tiny"
    | "link-big"
    | "link-medium"
    | "link-small";
  color?:
    | "main-black"
    | "main-white"
    | "dark-grey"
    | "medium-grey"
    | "grey"
    | "main-green"
    | "dark-green"
    | "error";
  children: React.ReactNode;
}

const Typography: React.FC<TypographyProps> = ({
  variant = "paragraph-medium",
  color,
  children,
  className = "",
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "h1":
        return "text-h1-mobile lg:text-h1-desktop font-pangea";
      case "h2":
        return "text-h2-mobile lg:text-h2-desktop font-pangea";
      case "h3":
        return "text-h3-mobile lg:text-h3-desktop font-pangea";
      case "h4":
        return "text-h4-mobile lg:text-h4-desktop font-pangea";
      case "h5":
        return "text-h5-mobile lg:text-h5-desktop font-pangea";
      case "paragraph-big":
        return "text-paragraph-big font-inter";
      case "paragraph-medium":
        return "text-paragraph-medium font-inter";
      case "paragraph-small":
        return "text-paragraph-small font-inter";
      case "paragraph-tiny":
        return "text-paragraph-tiny font-inter";
      case "link-big":
        return "text-link-big font-inter font-bold";
      case "link-medium":
        return "text-link-medium font-inter font-bold";
      case "link-small":
        return "text-link-small font-inter font-bold";
      default:
        return "text-paragraph-medium font-inter";
    }
  };

  const getColorClasses = () => {
    if (color) {
      return `text-${color}`;
    }

    // Default colors based on variant
    switch (variant) {
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "link-big":
      case "link-medium":
      case "link-small":
        return "text-main-black dark:text-main-white";
      case "paragraph-big":
      case "paragraph-medium":
      case "paragraph-small":
      case "paragraph-tiny":
        return "text-dark-grey dark:text-main-white";
      default:
        return "text-main-black dark:text-main-white";
    }
  };

  const getTag = () => {
    switch (variant) {
      case "h1":
        return "h1";
      case "h2":
        return "h2";
      case "h3":
        return "h3";
      case "h4":
        return "h4";
      case "h5":
        return "h5";
      case "link-big":
      case "link-medium":
      case "link-small":
        return "span";
      default:
        return "p";
    }
  };

  const Tag = getTag() as keyof React.JSX.IntrinsicElements;
  const variantClasses = getVariantClasses();
  const colorClasses = getColorClasses();

  return (
    <Tag
      className={`${variantClasses} ${colorClasses} ${className}`}
      {...(props as any)}
    >
      {children}
    </Tag>
  );
};

export default Typography;
