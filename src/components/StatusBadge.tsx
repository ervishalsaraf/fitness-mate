import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: 'operational' | 'degraded' | 'down' | 'checking';
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const statusConfig = {
    operational: {
      label: 'Operational',
      className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
    },
    degraded: {
      label: 'Degraded',
      className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20'
    },
    down: {
      label: 'Down',
      className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
    },
    checking: {
      label: 'Checking...',
      className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 animate-pulse'
    }
  };

  const config = statusConfig[status];

  return (
    <Badge 
      variant="outline" 
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
};
