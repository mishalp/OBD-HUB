'use client';

import type { InvoiceDetails, InvoiceTimelineEvent } from '@/lib/types/invoice';
import {
  formatTimelineTimestamp,
  getTimelineIcon,
  getTimelineIconClassName,
} from '@/lib/utils/invoiceTimeline';
import { cn } from '@/lib/utils/cn';

interface InvoiceTimelineProps {
  invoice: InvoiceDetails;
}

interface TimelineItemProps {
  event: InvoiceTimelineEvent;
  isLast: boolean;
}

const TimelineItem = ({ event, isLast }: TimelineItemProps) => {
  const Icon = getTimelineIcon(event.eventType);

  return (
    <li className="relative flex gap-3">
      {!isLast ? (
        <span
          className="absolute left-4 top-9 bottom-0 w-px bg-[#E5E7EB]"
          aria-hidden
        />
      ) : null}
      <span
        className={cn(
          'relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          getTimelineIconClassName(event.eventType),
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 pb-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-sm font-medium text-[#111827]">{event.title}</p>
          <time
            className="text-xs text-[#9CA3AF]"
            dateTime={event.createdAt}
            title={new Date(event.createdAt).toLocaleString('en-IN')}
          >
            {formatTimelineTimestamp(event.createdAt)}
          </time>
        </div>
        <p className="mt-0.5 text-sm text-[#6B7280]">{event.description}</p>
        {event.userName ? (
          <p className="mt-1 text-xs text-[#9CA3AF]">by {event.userName}</p>
        ) : null}
      </div>
    </li>
  );
};

export const InvoiceTimeline = ({ invoice }: InvoiceTimelineProps) => {
  const events = invoice.timeline ?? [];

  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <h3 className="text-base font-semibold text-[#111827]">Timeline</h3>
      {events.length === 0 ? (
        <p className="mt-4 text-sm text-[#6B7280]">No timeline events yet.</p>
      ) : (
        <ol className="mt-4">
          {events.map((event, index) => (
            <TimelineItem
              key={event.id}
              event={event}
              isLast={index === events.length - 1}
            />
          ))}
        </ol>
      )}
    </section>
  );
};
