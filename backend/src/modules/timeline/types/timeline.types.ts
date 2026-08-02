import { InvoiceTimelineEventType } from '../models/invoiceTimeline.model';

export interface SafeTimelineEvent {
  id: string;
  businessId: string;
  invoiceId: string;
  eventType: InvoiceTimelineEventType;
  title: string;
  description: string;
  userId: string | null;
  userName: string | null;
  referenceId: string | null;
  referenceType: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecordTimelineEventInput {
  businessId: string;
  invoiceId: string;
  eventType: InvoiceTimelineEventType;
  title: string;
  description: string;
  userId?: string | null;
  referenceId?: string | null;
  referenceType?: string | null;
  metadata?: Record<string, unknown>;
}
