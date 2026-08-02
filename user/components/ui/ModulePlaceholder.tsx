interface ModulePlaceholderProps {
  title: string;
  description?: string;
}

export const ModulePlaceholder = ({
  title,
  description,
}: ModulePlaceholderProps) => {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-8">
      <h2 className="text-xl font-semibold text-[#111827]">{title}</h2>
      {description ? <p className="mt-2 text-sm text-[#6B7280]">{description}</p> : null}
      <p className="mt-4 text-sm font-medium text-[#D32F2F]">
        This module will be implemented in an upcoming development phase.
      </p>
    </div>
  );
};
