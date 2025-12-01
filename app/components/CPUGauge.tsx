"use client";

interface CPUGaugeProps {
  temperature: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function CPUGauge({ temperature, size = "md", showLabel = true }: CPUGaugeProps) {
  const getTemperatureColor = (temp: number) => {
    if (temp >= 90) return "text-red-500";
    if (temp >= 70) return "text-orange-500";
    if (temp >= 50) return "text-yellow-500";
    return "text-blue-500";
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-16 h-16 text-lg";
      case "md":
        return "w-20 h-20 text-xl";
      case "lg":
        return "w-32 h-32 text-3xl";
      default:
        return "w-20 h-20 text-xl";
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`${getSizeClasses()} rounded-full border-4 ${getTemperatureColor(
          temperature
        )} border-current flex items-center justify-center font-bold bg-background/50 backdrop-blur`}
      >
        {temperature}°
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground font-medium">CPU</span>
      )}
    </div>
  );
}

