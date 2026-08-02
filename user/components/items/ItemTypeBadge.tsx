import { Badge } from '@/components/ui/Badge';

interface ItemTypeBadgeProps {
  type: 'Product' | 'Service' | string;
}

export const ItemTypeBadge = ({ type }: ItemTypeBadgeProps) => {
  return (
    <Badge tone={type === 'Product' ? 'info' : 'neutral'}>{type}</Badge>
  );
};
