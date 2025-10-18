'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient, EhrEndpoint, QueueStatus } from '@/lib/api-client';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Database,
  Server,
  Users
} from 'lucide-react';

interface MultiEndpointMonitoringProps {
  refreshInterval?: number;
}

export function MultiEndpointMonitoring({ refreshInterval = 5000 }: MultiEndpointMonitoringProps) {
  const { t } = useTranslation();
  const [selectedEhr, setSelectedEhr] = useState<string>('');
  const [endpoints, setEndpoints] = useState<EhrEndpoint[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load endpoints for selected EHR
  const loadEndpoints = async (ehrName: string) => {
    try {
      setLoading(true);
      setError(null);
      const endpoints = await apiClient.getEhrEndpoints(ehrName);
      setEndpoints(endpoints);
    } catch (err: any) {
      setError(err.message || 'Failed to load endpoints');
    } finally {
      setLoading(false);
    }
  };

  // Load queue status
  const loadQueueStatus = async () => {
    try {
      const status = await apiClient.getMultiEndpointQueueStatus();
      setQueueStatus(status);
    } catch (err: any) {
      console.error('Failed to load queue status:', err);
    }
  };

  // Auto-refresh queue status
  useEffect(() => {
    loadQueueStatus();
    const interval = setInterval(loadQueueStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Load endpoints when EHR is selected
  useEffect(() => {
    if (selectedEhr) {
      loadEndpoints(selectedEhr);
    }
  }, [selectedEhr]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
      case 'waiting':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'processing':
      case 'active':
        return <Activity className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      success: 'default',
      failed: 'destructive',
      error: 'destructive',
      pending: 'secondary',
      waiting: 'secondary',
      processing: 'outline',
      active: 'outline',
    };

    return (
      <Badge variant={variants[status.toLowerCase()] || 'outline'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Queue Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>PostgreSQL Queue Status</span>
          </CardTitle>
          <CardDescription>
            Real-time monitoring of the multi-endpoint queue system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queueStatus ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{queueStatus.pending || 0}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{queueStatus.processing || 0}</div>
                <div className="text-sm text-gray-600">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{queueStatus.completed || 0}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{queueStatus.failed || 0}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-gray-500">Loading queue status...</div>
            </div>
          )}
          
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={loadQueueStatus}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* EHR Endpoint Explorer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>EHR Endpoint Explorer</span>
          </CardTitle>
          <CardDescription>
            Explore available endpoints and their field mappings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Select value={selectedEhr} onValueChange={setSelectedEhr}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select EHR system" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Athena">Athena Health</SelectItem>
                  <SelectItem value="Allscripts">Allscripts Healthcare</SelectItem>
                </SelectContent>
              </Select>
              
              {selectedEhr && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadEndpoints(selectedEhr)}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Endpoints
                </Button>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              </div>
            )}

            {endpoints.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Available Endpoints ({endpoints.length})
                  </h3>
                  <Badge variant="outline">
                    {selectedEhr} EHR System
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {endpoints.map((endpoint) => (
                    <Card key={endpoint.endpointName} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {endpoint.endpointName.replace(/_/g, ' ').toUpperCase()}
                        </CardTitle>
                        <CardDescription>
                          {endpoint.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Supported Fields:</p>
                            <div className="flex flex-wrap gap-1">
                              {endpoint.supportedFields.map((field) => (
                                <Badge key={field} variant="secondary" className="text-xs">
                                  {field}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Endpoint URL:</p>
                            <code className="text-xs bg-gray-100 p-2 rounded block break-all">
                              {endpoint.endpointUrl}
                            </code>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {selectedEhr && endpoints.length === 0 && !loading && !error && (
              <div className="text-center py-8">
                <div className="text-gray-500">
                  No endpoints found for {selectedEhr}. Make sure the EHR system is configured.
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>System Health</span>
          </CardTitle>
          <CardDescription>
            Multi-endpoint system status and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-green-800">Multi-Endpoint Routing</div>
              <div className="text-xs text-green-600">Smart endpoint selection active</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-blue-800">PostgreSQL Queue</div>
              <div className="text-xs text-blue-600">Database-based processing</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-purple-800">Real-time Monitoring</div>
              <div className="text-xs text-purple-600">Auto-refresh every 5 seconds</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
