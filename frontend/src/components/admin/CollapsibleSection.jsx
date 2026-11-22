import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function CollapsibleSection({ title, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white shadow rounded mb-4 overflow-hidden border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center p-4 text-left"
      >
        <span className="text-caribbean font-semibold text-lg">{title}</span>
        {open ? (
          <ChevronUp className="text-caribbean" />
        ) : (
          <ChevronDown className="text-caribbean" />
        )}
      </button>

      <div
        className={`transition-all duration-300 ${
          open ? "max-h-[75vh] p-4 overflow-y-auto overflow-x-auto" : "max-h-0 p-0 overflow-hidden"
        }`}
      >
        {open && children}
      </div>
    </div>
  );
}
