import React, { useState } from "react";
import { CircleHelp } from "lucide-react";

export default function InfoTooltip({
  label,
  children
}) {
  const [open, setOpen] = useState(false);

  return (
    <span className="info-tooltip-wrap">
      <button
        type="button"
        className="info-tooltip-button"
        aria-label={`What does ${label} mean?`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onBlur={() => setOpen(false)}
      >
        <CircleHelp size={13} />
      </button>

      {open && (
        <span
          className="info-tooltip-popover"
          role="tooltip"
        >
          <strong>{label}</strong>
          <span>{children}</span>
        </span>
      )}
    </span>
  );
}
