interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES: Record<string, string> = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export default function LoadingSpinner({ size = "md" }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center">
      <div
        className={`border-2 border-accent-purple/30 border-t-accent-purple animate-spin rounded-full ${SIZE_CLASSES[size]}`}
      />
    </div>
  );
}
