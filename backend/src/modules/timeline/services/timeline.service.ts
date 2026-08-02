import { Types } from 'mongoose';
import { ApiError } from '../../../utils/ApiError';
import { User } from '../../auth/models/user.model';
import {
  IInvoiceTimelineEventDocument,
  InvoiceTimelineEvent,
} from '../models/invoiceTimeline.model';
import { RecordTimelineEventInput, SafeTimelineEvent } from '../types/timeline.types';

const getDisplayName = (
  user: { firstName?: string; lastName?: string } | null | undefined,
): string | null => {
  if (!user) {
    return null;
  }
  return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || null;
};

const toSafeTimelineEvent = (
  event: IInvoiceTimelineEventDocument,
  userName: string | null = null,
): SafeTimelineEvent => ({
  id: event._id.toString(),
  businessId: event.businessId.toString(),
  invoiceId: event.invoiceId.toString(),
  eventType: event.eventType,
  title: event.title,
  description: event.description,
  userId: event.userId ? event.userId.toString() : null,
  userName,
  referenceId: event.referenceId ? event.referenceId.toString() : null,
  referenceType: event.referenceType,
  metadata: (event.metadata ?? {}) as Record<string, unknown>,
  createdAt: event.createdAt,
  updatedAt: event.updatedAt,
});

/**
 * Centralized timeline publisher. Controllers must not call this directly —
 * business services (invoice, payment, etc.) own when events are recorded.
 */
export const recordTimelineEvent = async (
  input: RecordTimelineEventInput,
): Promise<SafeTimelineEvent> => {
  if (!Types.ObjectId.isValid(input.businessId)) {
    throw new ApiError(400, 'Invalid business id');
  }
  if (!Types.ObjectId.isValid(input.invoiceId)) {
    throw new ApiError(400, 'Invalid invoice id');
  }

  try {
    const event = await InvoiceTimelineEvent.create({
      businessId: new Types.ObjectId(input.businessId),
      invoiceId: new Types.ObjectId(input.invoiceId),
      eventType: input.eventType,
      title: input.title.trim(),
      description: input.description.trim(),
      userId:
        input.userId && Types.ObjectId.isValid(input.userId)
          ? new Types.ObjectId(input.userId)
          : null,
      referenceId:
        input.referenceId && Types.ObjectId.isValid(input.referenceId)
          ? new Types.ObjectId(input.referenceId)
          : null,
      referenceType: input.referenceType ?? null,
      metadata: input.metadata ?? {},
    });

    let userName: string | null = null;
    if (event.userId) {
      const user = await User.findById(event.userId).select('firstName lastName').exec();
      userName = getDisplayName(user);
    }

    return toSafeTimelineEvent(event, userName);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      error instanceof Error ? error.message : 'Failed to create timeline event',
    );
  }
};

export const recordTimelineEvents = async (
  inputs: RecordTimelineEventInput[],
): Promise<SafeTimelineEvent[]> => {
  const events: SafeTimelineEvent[] = [];
  for (const input of inputs) {
    events.push(await recordTimelineEvent(input));
  }
  return events;
};

/**
 * Returns timeline events for an invoice, newest first.
 * Populates user names in a single batch query.
 */
export const listTimelineForInvoice = async (
  businessId: string,
  invoiceId: string,
): Promise<SafeTimelineEvent[]> => {
  if (!Types.ObjectId.isValid(businessId) || !Types.ObjectId.isValid(invoiceId)) {
    return [];
  }

  const events = await InvoiceTimelineEvent.find({
    businessId: new Types.ObjectId(businessId),
    invoiceId: new Types.ObjectId(invoiceId),
  })
    .sort({ createdAt: -1 })
    .exec();

  if (events.length === 0) {
    return [];
  }

  const userIds = [
    ...new Set(
      events
        .map((event) => (event.userId ? event.userId.toString() : null))
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const users =
    userIds.length > 0
      ? await User.find({ _id: { $in: userIds } })
          .select('firstName lastName')
          .exec()
      : [];

  const userMap = new Map(users.map((user) => [user._id.toString(), getDisplayName(user)]));

  return events.map((event) =>
    toSafeTimelineEvent(
      event,
      event.userId ? userMap.get(event.userId.toString()) ?? null : null,
    ),
  );
};
