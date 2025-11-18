import { useState } from "react";
import { useServiceHealth } from "@/hooks/useServiceHealth";
import { StatusCard } from "@/components/StatusCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw, Database, Lock, Zap, HardDrive, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const Status = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const { servicesHealth, isChecking, overallStatus, refresh } = useServiceHealth(autoRefresh, refreshInterval);

  const overallStatusConfig = {
    operational: {
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10',
      label: 'All Systems Operational'
    },
    degraded: {
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      label: 'Some Services Degraded'
    },
    down: {
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10',
      label: 'Service Disruption'
    },
    checking: {
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
      label: 'Checking Services...'
    }
  };

  const config = overallStatusConfig[overallStatus];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">System Status</h1>
            <p className="text-muted-foreground">
              Real-time health monitoring for all backend services
            </p>
          </div>

          {/* Overall Status Card */}
          <Card className={config.bgColor}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className={`h-8 w-8 ${config.color}`} />
                  <div>
                    <CardTitle className={config.color}>{config.label}</CardTitle>
                    <CardDescription>
                      Last updated {formatDistanceToNow(servicesHealth.database.lastChecked, { addSuffix: true })}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  onClick={refresh}
                  disabled={isChecking}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monitoring Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-refresh" className="flex flex-col gap-1">
                  <span>Auto-refresh</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Automatically check service health
                  </span>
                </Label>
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
              </div>
              
              {autoRefresh && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="refresh-interval">Refresh Interval</Label>
                  <Select
                    value={refreshInterval.toString()}
                    onValueChange={(value) => setRefreshInterval(Number(value))}
                  >
                    <SelectTrigger id="refresh-interval" className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30000">30 seconds</SelectItem>
                      <SelectItem value="60000">1 minute</SelectItem>
                      <SelectItem value="300000">5 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Status Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <StatusCard
              serviceName="Database"
              icon={<Database className="h-5 w-5 text-primary" />}
              health={servicesHealth.database}
            />
            <StatusCard
              serviceName="Authentication"
              icon={<Lock className="h-5 w-5 text-primary" />}
              health={servicesHealth.auth}
            />
            <StatusCard
              serviceName="Edge Functions"
              icon={<Zap className="h-5 w-5 text-primary" />}
              health={servicesHealth.edgeFunctions}
            />
            <StatusCard
              serviceName="Storage"
              icon={<HardDrive className="h-5 w-5 text-primary" />}
              health={servicesHealth.storage}
            />
          </div>

          {/* Help Section */}
          {overallStatus !== 'operational' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Troubleshooting Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Check your internet connection</p>
                <p>• Try refreshing the page</p>
                <p>• Clear your browser cache and cookies</p>
                <p>• If issues persist, please contact support</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Status;
