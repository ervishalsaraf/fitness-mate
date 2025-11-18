import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";
import type { ServiceHealth } from "@/hooks/useServiceHealth";

interface StatusCardProps {
  serviceName: string;
  icon: React.ReactNode;
  health: ServiceHealth;
}

export const StatusCard = ({ serviceName, icon, health }: StatusCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg">{serviceName}</CardTitle>
          </div>
          <StatusBadge status={health.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Response Time</span>
          <span className="font-medium">
            {health.responseTime ? `${health.responseTime}ms` : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Last Checked</span>
          <span className="font-medium">
            {formatDistanceToNow(health.lastChecked, { addSuffix: true })}
          </span>
        </div>
        {health.error && (
          <Alert variant="destructive" className="mt-3">
            <AlertDescription className="text-xs">
              {health.error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
