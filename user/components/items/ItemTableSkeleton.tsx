export const ItemTableSkeleton = () => {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
      <div className="space-y-3 p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-10 animate-pulse rounded-md bg-[#F3F4F6]" />
        ))}
      </div>
    </div>
  );
};
