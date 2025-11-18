import { useState, useEffect, useCallback } from 'react';
import { 
  checkDatabaseHealth, 
  checkAuthHealth, 
  checkEdgeFunctionHealth, 
  checkStorageHealth,
  type HealthCheckResult 
} from '@/lib/healthChecks';

export interface ServiceHealth extends HealthCheckResult {
  lastChecked: Date;
}

export interface ServicesHealth {
  database: ServiceHealth;
  auth: ServiceHealth;
  edgeFunctions: ServiceHealth;
  storage: ServiceHealth;
}

const initialServiceHealth: ServiceHealth = {
  status: 'checking',
  responseTime: null,
  error: null,
  lastChecked: new Date()
};

export const useServiceHealth = (autoRefresh: boolean = true, interval: number = 30000) => {
  const [servicesHealth, setServicesHealth] = useState<ServicesHealth>({
    database: initialServiceHealth,
    auth: initialServiceHealth,
    edgeFunctions: initialServiceHealth,
    storage: initialServiceHealth
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkAllServices = useCallback(async () => {
    setIsChecking(true);
    
    const [database, auth, edgeFunctions, storage] = await Promise.all([
      checkDatabaseHealth(),
      checkAuthHealth(),
      checkEdgeFunctionHealth(),
      checkStorageHealth()
    ]);

    const now = new Date();
    setServicesHealth({
      database: { ...database, lastChecked: now },
      auth: { ...auth, lastChecked: now },
      edgeFunctions: { ...edgeFunctions, lastChecked: now },
      storage: { ...storage, lastChecked: now }
    });
    
    setIsChecking(false);
  }, []);

  useEffect(() => {
    checkAllServices();

    if (autoRefresh) {
      const timer = setInterval(checkAllServices, interval);
      return () => clearInterval(timer);
    }
  }, [autoRefresh, interval, checkAllServices]);

  const getOverallStatus = (): 'operational' | 'degraded' | 'down' | 'checking' => {
    const services = Object.values(servicesHealth);
    
    if (services.some(s => s.status === 'checking')) return 'checking';
    if (services.some(s => s.status === 'down')) return 'down';
    if (services.some(s => s.status === 'degraded')) return 'degraded';
    return 'operational';
  };

  return {
    servicesHealth,
    isChecking,
    overallStatus: getOverallStatus(),
    refresh: checkAllServices
  };
};
