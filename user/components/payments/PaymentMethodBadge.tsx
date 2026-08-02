import type { PaymentMethod } from '@/lib/types/payment';
import { Badge, type BadgeTone } from '@/components/ui/Badge';

interface PaymentMethodBadgeProps {
  method: PaymentMethod | string;
}

const METHOD_TONE: Record<string, BadgeTone> = {
  Cash: 'success',
  UPI: 'primary',
  Card: 'info',
  'Bank Transfer': 'neutral',
  Cheque: 'warning',
  Other: 'neutral',
};

export const PaymentMethodBadge = ({ method }: PaymentMethodBadgeProps) => {
  return <Badge tone={METHOD_TONE[method] ?? 'neutral'}>{method}</Badge>;
};
