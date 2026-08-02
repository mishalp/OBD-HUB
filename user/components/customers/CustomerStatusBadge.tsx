import { Badge } from '@/components/ui/Badge';

interface CustomerStatusBadgeProps {
  isActive: boolean;
}

export const CustomerStatusBadge = ({ isActive }: CustomerStatusBadgeProps) => {
  return (
    <Badge tone={isActive ? 'success' : 'neutral'}>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
};
