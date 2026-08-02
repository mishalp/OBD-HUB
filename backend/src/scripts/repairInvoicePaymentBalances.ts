import { connectDatabase } from '../database/connection';
import { Invoice } from '../modules/invoices/models/invoice.model';
import { Payment } from '../modules/payments/models/payment.model';
import { roundMoney } from '../modules/invoices/utils/invoiceCalculations';
import { syncInvoicePaymentState } from '../modules/invoices/utils/invoicePaymentBalance';

/**
 * Idempotent repair for invoice payment fields.
 *
 * For every invoice:
 * 1. totalPaid = SUM(payments.amount)
 * 2. outstandingBalance = grandTotal - totalPaid
 * 3. paymentStatus / status synced from balances
 */
const repairInvoicePaymentBalances = async (): Promise<void> => {
  await connectDatabase();

  const invoices = await Invoice.find({}).exec();
  let scanned = 0;
  let updated = 0;
  let unchanged = 0;

  console.log(`Scanning ${invoices.length} invoice(s)...`);

  for (const invoice of invoices) {
    scanned += 1;

    const paymentAgg = await Payment.aggregate<{ totalPaid: number }>([
      {
        $match: {
          businessId: invoice.businessId,
          invoiceId: invoice._id,
        },
      },
      { $group: { _id: null, totalPaid: { $sum: '$amount' } } },
    ]).exec();

    const totalPaid = roundMoney(paymentAgg[0]?.totalPaid ?? 0);
    const synced = syncInvoicePaymentState(
      invoice.grandTotal,
      totalPaid,
      invoice.status,
    );

    const nextTotalPaid = synced.totalPaid;
    const nextOutstanding = synced.outstandingBalance;
    const nextPaymentStatus = synced.paymentStatus;
    const nextStatus = synced.status;

    const needsUpdate =
      roundMoney(invoice.totalPaid ?? 0) !== nextTotalPaid ||
      roundMoney(invoice.outstandingBalance ?? -1) !== nextOutstanding ||
      invoice.paymentStatus !== nextPaymentStatus ||
      invoice.status !== nextStatus;

    if (!needsUpdate) {
      unchanged += 1;
      continue;
    }

    invoice.totalPaid = nextTotalPaid;
    invoice.outstandingBalance = nextOutstanding;
    invoice.paymentStatus = nextPaymentStatus;
    invoice.status = nextStatus;
    await invoice.save();
    updated += 1;

    console.log(
      `Repaired ${invoice.invoiceNumber}: paid=${nextTotalPaid}, outstanding=${nextOutstanding}, paymentStatus=${nextPaymentStatus}, status=${nextStatus}`,
    );
  }

  console.log('Repair complete');
  console.log(`Scanned: ${scanned}`);
  console.log(`Updated: ${updated}`);
  console.log(`Unchanged: ${unchanged}`);
  process.exit(0);
};

repairInvoicePaymentBalances().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Unknown repair script error';
  console.error('Failed to repair invoice payment balances:', message);
  process.exit(1);
});
