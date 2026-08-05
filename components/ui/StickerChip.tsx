import type { ButtonHTMLAttributes, ReactNode } from "react";

type StickerChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  selected?: boolean;
};

export function StickerChip({ children, className = "", selected = false, type = "button", ...props }: StickerChipProps) {
  return (
    <button
      aria-pressed={selected}
      className={`sticker-chip ${selected ? "sticker-chip-selected" : ""} ${className}`}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
