"use client";

import { useEffect } from "react";

interface LoaderProps {
  subtitle?: string;
  redirectTo?: string;
  redirectDelay?: number;
}

export function Loader({
  subtitle = "Please wait while we load your account...",
  redirectTo,
  redirectDelay = 2000,
}: LoaderProps) {
  useEffect(() => {
    if (!redirectTo) return;

    const timer = setTimeout(() => {
      window.location.href = redirectTo;
    }, redirectDelay);

    return () => clearTimeout(timer);
  }, [redirectTo, redirectDelay]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="text-center">
        {/* Animated Loader SVG */}
        <svg
          className="loader mx-auto mb-6"
          width="240"
          height="240"
          viewBox="0 0 240 240"
        >
          <circle
            className="loader-ring loader-ring-a"
            cx="120"
            cy="120"
            r="105"
            fill="none"
            stroke="#dc2626"
            strokeWidth="20"
            strokeDasharray="0 660"
            strokeDashoffset="-330"
            strokeLinecap="round"
          ></circle>
          <circle
            className="loader-ring loader-ring-b"
            cx="120"
            cy="120"
            r="35"
            fill="none"
            stroke="#dc2626"
            strokeWidth="20"
            strokeDasharray="0 220"
            strokeDashoffset="-110"
            strokeLinecap="round"
          ></circle>
          <circle
            className="loader-ring loader-ring-c"
            cx="85"
            cy="120"
            r="70"
            fill="none"
            stroke="#dc2626"
            strokeWidth="20"
            strokeDasharray="0 440"
            strokeLinecap="round"
          ></circle>
          <circle
            className="loader-ring loader-ring-d"
            cx="155"
            cy="120"
            r="70"
            fill="none"
            stroke="#dc2626"
            strokeWidth="20"
            strokeDasharray="0 440"
            strokeLinecap="round"
          ></circle>
        </svg>

        <p className="text-slate-600">{subtitle}</p>
      </div>
    </div>
  );
}
