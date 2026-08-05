import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
};

export function IconButton({ label, children, className = "", type = "button", ...props }: IconButtonProps) {
  return (
    <button aria-label={label} className={`ui-icon-button ${className}`} type={type} {...props}>
      {children}
    </button>
  );
}
