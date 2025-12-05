"use client";

import { Cpu } from "lucide-react";

interface CPUGaugeProps {
  temperature: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function CPUGauge({
  temperature,
  size = "md",
  showLabel = true,
}: CPUGaugeProps) {
  const getTemperatureColor = (temp: number) => {
    if (temp >= 90)
      return {
        text: "text-red-500",
        glow: "shadow-[0_0_20px_rgba(239,68,68,0.6)]",
        bg: "bg-red-500/10",
      };
    if (temp >= 70)
      return {
        text: "text-orange-500",
        glow: "shadow-[0_0_18px_rgba(249,115,22,0.5)]",
        bg: "bg-orange-500/10",
      };
    if (temp >= 50)
      return {
        text: "text-yellow-500",
        glow: "shadow-[0_0_15px_rgba(234,179,8,0.4)]",
        bg: "bg-yellow-500/10",
      };
    return {
      text: "text-blue-500",
      glow: "shadow-[0_0_12px_rgba(59,130,246,0.4)]",
      bg: "bg-blue-500/10",
    };
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return { icon: "h-12 w-12", text: "text-lg", label: "text-xs" };
      case "md":
        return { icon: "h-16 w-16", text: "text-xl", label: "text-xs" };
      case "lg":
        return { icon: "h-24 w-24", text: "text-3xl", label: "text-sm" };
      default:
        return { icon: "h-16 w-16", text: "text-xl", label: "text-xs" };
    }
  };

  const color = getTemperatureColor(temperature);
  const sizes = getSizeClasses();

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative ${sizes.icon} ${color.bg} rounded-lg pl-3 pr-2 ${color.glow} transition-all duration-300`}
      >
        <Cpu
          className={`w-full h-full ${color.text} transition-all duration-300 opacity-20`}
        />
        {/* 온도 숫자 - CPU 아이콘 위에 명확하게 표시 */}
        <div
          className={`absolute inset-0 flex items-center justify-center ${sizes.text} font-bold ${color.text} drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`}
        >
          {temperature % 1 === 0 ? temperature : temperature.toFixed(1)}°C
        </div>
      </div>
    </div>
  );
}
