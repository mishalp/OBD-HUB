export const REPORT_PERIODS = [
  'today',
  'yesterday',
  'last_7_days',
  'last_30_days',
  'current_month',
  'previous_month',
  'current_year',
  'custom',
] as const;

export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export const TREND_GRANULARITIES = ['daily', 'weekly', 'monthly', 'yearly'] as const;
export type TrendGranularity = (typeof TREND_GRANULARITIES)[number];

export interface ResolvedDateRange {
  from: Date;
  to: Date;
}

const startOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const parseDate = (value?: string | null): Date | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Resolves a reporting period (or custom range) into concrete start/end dates.
 * All ranges are inclusive and snapped to the day boundaries.
 */
export const resolveDateRange = (
  period: ReportPeriod,
  fromDate?: string | null,
  toDate?: string | null,
  now: Date = new Date(),
): ResolvedDateRange => {
  const today = startOfDay(now);

  switch (period) {
    case 'today':
      return { from: startOfDay(today), to: endOfDay(today) };

    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    }

    case 'last_7_days': {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from: startOfDay(from), to: endOfDay(today) };
    }

    case 'last_30_days': {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { from: startOfDay(from), to: endOfDay(today) };
    }

    case 'current_month': {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { from: startOfDay(from), to: endOfDay(to) };
    }

    case 'previous_month': {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: startOfDay(from), to: endOfDay(to) };
    }

    case 'current_year': {
      const from = new Date(today.getFullYear(), 0, 1);
      const to = new Date(today.getFullYear(), 11, 31);
      return { from: startOfDay(from), to: endOfDay(to) };
    }

    case 'custom':
    default: {
      const parsedFrom = parseDate(fromDate);
      const parsedTo = parseDate(toDate);

      // Fallback: last 30 days if a custom range is incomplete.
      if (!parsedFrom || !parsedTo) {
        const fallbackFrom = new Date(today);
        fallbackFrom.setDate(fallbackFrom.getDate() - 29);
        return {
          from: startOfDay(parsedFrom ?? fallbackFrom),
          to: endOfDay(parsedTo ?? today),
        };
      }

      return { from: startOfDay(parsedFrom), to: endOfDay(parsedTo) };
    }
  }
};

/** Maps trend granularity to a MongoDB $dateTrunc unit. */
export const granularityToDateTruncUnit = (
  granularity: TrendGranularity,
): 'day' | 'week' | 'month' | 'year' => {
  switch (granularity) {
    case 'weekly':
      return 'week';
    case 'monthly':
      return 'month';
    case 'yearly':
      return 'year';
    case 'daily':
    default:
      return 'day';
  }
};
