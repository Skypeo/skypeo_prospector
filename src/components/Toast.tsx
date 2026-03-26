"use client";

import { useEffect } from "react";

export default function Toast({
  message,
  type = "success",
  onDone,
}: {
  message: string;
  type?: "success" | "error";
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-xl animate-fade-in"
      style={{
        background:
          type === "success"
            ? "linear-gradient(135deg, #008f78, #2b3475)"
            : "rgba(239,68,68,0.92)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      {type === "success" ? (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {message}
    </div>
  );
}
