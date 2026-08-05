import type { ReactNode } from "react";
import { Button } from "./Button";

type SheetProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
};

export function Sheet({ open, title, description, children, footer, onClose }: SheetProps) {
  if (!open) return null;

  return (
    <div className="sheet-backdrop" role="presentation">
      <section aria-labelledby="preferences-title" className="sheet-panel" role="dialog" aria-modal="true">
        <div className="sheet-header">
          <div>
            <p className="eyebrow">First-run setup</p>
            <h2 id="preferences-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <Button aria-label="Close preferences" className="sheet-close" onClick={onClose} variant="ghost">
            Close
          </Button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-footer">{footer}</div>}
      </section>
    </div>
  );
}
