import { Badge } from '@/components/ui/Badge';

interface ItemStatusBadgeProps {
  isActive: boolean;
}

export const ItemStatusBadge = ({ isActive }: ItemStatusBadgeProps) => {
  return (
    <Badge tone={isActive ? 'success' : 'neutral'}>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
};
