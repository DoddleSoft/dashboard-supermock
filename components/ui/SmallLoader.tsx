"use client";

interface SmallLoaderProps {
  subtitle?: string;
  inline?: boolean;
}

export function SmallLoader({
  subtitle = "",
  inline = false,
}: SmallLoaderProps) {
  const containerClass = inline
    ? "flex items-center justify-center"
    : "flex items-center justify-center py-8";

  return (
    <div className={containerClass}>
      <div className="text-center">
        {/* Scaled-down Animated Loader SVG */}
        <svg
          className="loader mx-auto mb-3 text-red-600"
          width="120"
          height="120"
          viewBox="0 0 240 240"
        >
          <circle
            className="loader-ring loader-ring-a text-red-400"
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
            className="loader-ring loader-ring-b text-red-800"
            cx="120"
            cy="120"
            r="35"
            fill="none"
            stroke="#900a0a"
            strokeWidth="20"
            strokeDasharray="0 220"
            strokeDashoffset="-110"
            strokeLinecap="round"
          ></circle>
          <circle
            className="loader-ring loader-ring-c text-red-800"
            cx="85"
            cy="120"
            r="70"
            fill="none"
            stroke="#900a0a"
            strokeWidth="20"
            strokeDasharray="0 440"
            strokeLinecap="round"
          ></circle>
          <circle
            className="loader-ring loader-ring-d text-red-400"
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

        {subtitle && <p className="text-red-600 text-sm">{subtitle}</p>}
      </div>
    </div>
  );
}
