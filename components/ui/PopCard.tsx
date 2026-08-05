import type { HTMLAttributes, ReactNode } from "react";

type PopCardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  accent?: "paper" | "red" | "yellow" | "blue" | "green" | "pink";
  as?: "article" | "section" | "div";
};

export function PopCard({ children, className = "", accent = "paper", as: Tag = "article", ...props }: PopCardProps) {
  return (
    <Tag className={`pop-card pop-card-${accent} ${className}`} {...props}>
      {children}
    </Tag>
  );
}
