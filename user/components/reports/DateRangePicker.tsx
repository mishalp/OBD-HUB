'use client';

interface DateRangePickerProps {
  fromDate: string;
  toDate: string;
  onChange: (range: { fromDate: string; toDate: string }) => void;
  disabled?: boolean;
}

export const DateRangePicker = ({
  fromDate,
  toDate,
  onChange,
  disabled = false,
}: DateRangePickerProps) => {
  const invalid = Boolean(fromDate && toDate && new Date(fromDate) > new Date(toDate));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-[#6B7280]">
          From
          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            disabled={disabled}
            onChange={(event) => onChange({ fromDate: event.target.value, toDate })}
            className="ui-input disabled:bg-[#FAFAFA]"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-[#6B7280]">
          To
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            disabled={disabled}
            onChange={(event) => onChange({ fromDate, toDate: event.target.value })}
            className="ui-input disabled:bg-[#FAFAFA]"
          />
        </label>
      </div>
      {invalid ? (
        <p className="text-xs text-[#dc2626]">From date cannot be after to date.</p>
      ) : null}
    </div>
  );
};
