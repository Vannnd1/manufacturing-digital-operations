import { useState, useEffect } from "react";

/**
 * Hook providing real-time ticking clock for manufacturing telemetry:
 * - Updates every 1000ms
 * - formattedTime includes seconds: e.g. "2:14:35 PM" (tabular-nums font)
 * - formattedShort includes hours and minutes: e.g. "2:14 PM"
 */
export function useLiveTime() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const formattedShort = time.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return { time, formattedTime, formattedShort };
}
