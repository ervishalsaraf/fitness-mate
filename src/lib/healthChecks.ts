import { supabase } from "@/integrations/supabase/client";

export interface HealthCheckResult {
  status: 'operational' | 'degraded' | 'down' | 'checking';
  responseTime: number | null;
  error: string | null;
}

const timeout = (ms: number): Promise<never> => {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Request timeout')), ms)
  );
};

export const checkDatabaseHealth = async (): Promise<HealthCheckResult> => {
  const startTime = Date.now();
  try {
    const result = await Promise.race([
      supabase.from('profiles').select('count', { count: 'exact', head: true }),
      timeout(10000)
    ]);
    
    const responseTime = Date.now() - startTime;
    
    if (result.error) {
      return {
        status: 'down',
        responseTime,
        error: result.error.message
      };
    }
    
    return {
      status: responseTime < 1000 ? 'operational' : 'degraded',
      responseTime,
      error: null
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const checkAuthHealth = async (): Promise<HealthCheckResult> => {
  const startTime = Date.now();
  try {
    const result = await Promise.race([
      supabase.auth.getSession(),
      timeout(10000)
    ]);
    
    const responseTime = Date.now() - startTime;
    
    if (result.error) {
      return {
        status: 'down',
        responseTime,
        error: result.error.message
      };
    }
    
    return {
      status: responseTime < 1000 ? 'operational' : 'degraded',
      responseTime,
      error: null
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const checkEdgeFunctionHealth = async (): Promise<HealthCheckResult> => {
  const startTime = Date.now();
  try {
    const result = await Promise.race([
      supabase.functions.invoke('check-subscription'),
      timeout(10000)
    ]);
    
    const responseTime = Date.now() - startTime;
    
    if (result.error) {
      return {
        status: 'down',
        responseTime,
        error: result.error.message
      };
    }
    
    return {
      status: responseTime < 1000 ? 'operational' : 'degraded',
      responseTime,
      error: null
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const checkStorageHealth = async (): Promise<HealthCheckResult> => {
  const startTime = Date.now();
  try {
    const result = await Promise.race([
      supabase.storage.from('event-images').list('', { limit: 1 }),
      timeout(10000)
    ]);
    
    const responseTime = Date.now() - startTime;
    
    if (result.error) {
      return {
        status: 'down',
        responseTime,
        error: result.error.message
      };
    }
    
    return {
      status: responseTime < 1000 ? 'operational' : 'degraded',
      responseTime,
      error: null
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
