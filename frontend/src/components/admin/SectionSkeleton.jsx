export default function SectionSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border border-gray-200 rounded-xl p-3 animate-pulse"
        >
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}
