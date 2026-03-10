interface SkeletonTextProps {
  width?: string;
  className?: string;
}

interface SkeletonCircleProps {
  size?: string;
  className?: string;
}

interface SkeletonGridProps {
  count?: number;
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-surface rounded-xl h-48 ${className}`}
    />
  );
}

export function SkeletonText({ width = "w-full", className = "" }: SkeletonTextProps) {
  return (
    <div
      className={`animate-pulse bg-surface rounded h-4 ${width} ${className}`}
    />
  );
}

export function SkeletonCircle({ size = "w-10 h-10", className = "" }: SkeletonCircleProps) {
  return (
    <div
      className={`animate-pulse bg-surface rounded-full ${size} ${className}`}
    />
  );
}

export function SkeletonGrid({ count = 6 }: SkeletonGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
