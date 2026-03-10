"use client";

interface QuestProgressProps {
  currentCount: number;
  requiredCount: number;
  showLabel?: boolean;
}

export default function QuestProgress({
  currentCount,
  requiredCount,
  showLabel = false,
}: QuestProgressProps) {
  const percent = Math.min(100, (currentCount / requiredCount) * 100);
  const isComplete = currentCount >= requiredCount;

  return (
    <div>
      <div className="bg-surface rounded-full h-3 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r from-accent-purple to-accent-cyan rounded-full transition-all duration-500 ${
            isComplete ? "shadow-lg shadow-accent-cyan/30" : ""
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-sm text-gray-400 mt-1.5">
          {currentCount} / {requiredCount} completed
        </p>
      )}
    </div>
  );
}
