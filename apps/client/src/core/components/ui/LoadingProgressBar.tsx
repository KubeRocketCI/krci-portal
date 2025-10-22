import { useEffect, useState } from "react";

export function LoadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(10);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + 10));
    }, 300);

    return () => {
      clearInterval(interval);
      setProgress(100);
    };
  }, []);

  return (
    <div
      style={{
        zIndex: 9999,
        position: "fixed",
        top: 0,
        left: 0,
        width: `${progress}%`,
        height: "3px",
        background: "var(--primary)",
        transition: "width 0.3s ease-out",
      }}
    />
  );
}
