export const DueTableSkeleton = () => {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
      <div className="divide-y divide-[#E5E7EB]">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="grid grid-cols-10 gap-4 px-4 py-4">
            {Array.from({ length: 10 }).map((__, cell) => (
              <div key={cell} className="h-4 animate-pulse rounded bg-[#F3F4F6]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
