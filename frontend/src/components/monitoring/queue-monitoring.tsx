'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient, QueueStatus, JobStatus } from '@/lib/api-client';

export function QueueMonitoring() {
  const { t } = useTranslation();
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [jobId, setJobId] = useState('');
  const [loading, setLoading] = useState(false);
  const [jobLoading, setJobLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadQueueStatus();
    // Auto-refresh every 5 seconds
    const interval = setInterval(loadQueueStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadQueueStatus = async () => {
    setLoading(true);
    try {
      const status = await apiClient.getQueueStatus();
      setQueueStatus(status);
    } catch (error) {
      console.error('Error loading queue status:', error);
      setMessage({ type: 'error', text: t('errors.serverError') });
    } finally {
      setLoading(false);
    }
  };

  const loadJobStatus = async () => {
    if (!jobId.trim()) return;

    setJobLoading(true);
    try {
      const status = await apiClient.getJobStatus(jobId);
      setJobStatus(status);
    } catch (error) {
      console.error('Error loading job status:', error);
      setMessage({ type: 'error', text: t('errors.serverError') });
    } finally {
      setJobLoading(false);
    }
  };

  const retryJob = async () => {
    if (!jobId.trim()) return;

    try {
      await apiClient.retryJob(jobId);
      setMessage({ type: 'success', text: t('success.transactionRetried') });
      loadJobStatus(); // Refresh job status
    } catch (error) {
      console.error('Error retrying job:', error);
      setMessage({ type: 'error', text: t('errors.serverError') });
    }
  };

  const clearCache = async () => {
    try {
      await apiClient.clearAllCaches();
      setMessage({ type: 'success', text: t('success.cacheCleared') });
    } catch (error) {
      console.error('Error clearing cache:', error);
      setMessage({ type: 'error', text: t('errors.serverError') });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Queue Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>{t('queueStatus.title')}</CardTitle>
          <CardDescription>Real-time queue monitoring and management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-center py-4">
              <p>{t('common.loading')}</p>
            </div>
          ) : queueStatus ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{queueStatus.waiting}</div>
                <div className="text-sm text-yellow-800">{t('queueStatus.waiting')}</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{queueStatus.active}</div>
                <div className="text-sm text-blue-800">{t('queueStatus.active')}</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{queueStatus.completed}</div>
                <div className="text-sm text-green-800">{t('queueStatus.completed')}</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{queueStatus.failed}</div>
                <div className="text-sm text-red-800">{t('queueStatus.failed')}</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Unable to load queue status
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={loadQueueStatus} variant="outline">
              {t('common.refresh')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Job Status Lookup */}
      <Card>
        <CardHeader>
          <CardTitle>Job Status Lookup</CardTitle>
          <CardDescription>Check the status of a specific job</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="job-id">Job ID</Label>
              <Input
                id="job-id"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                placeholder="Enter job ID"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadJobStatus} disabled={jobLoading || !jobId.trim()}>
                {jobLoading ? t('common.loading') : 'Check Status'}
              </Button>
            </div>
          </div>

          {jobStatus && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Job Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>ID:</strong> {jobStatus.id}
                </div>
                <div>
                  <strong>State:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(jobStatus.state)}`}>
                    {jobStatus.state}
                  </span>
                </div>
                <div>
                  <strong>Progress:</strong> {jobStatus.progress}%
                </div>
                <div>
                  <strong>Attempts:</strong> {jobStatus.attempts}
                </div>
                {jobStatus.failedReason && (
                  <div className="md:col-span-2">
                    <strong>Failed Reason:</strong> 
                    <p className="text-red-600 mt-1">{jobStatus.failedReason}</p>
                  </div>
                )}
              </div>
              
              {jobStatus.state === 'failed' && (
                <div className="mt-4">
                  <Button onClick={retryJob} variant="outline" size="sm">
                    {t('common.retry')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Management</CardTitle>
          <CardDescription>Manage application cache</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end space-x-4">
            <Button onClick={clearCache} variant="outline">
              {t('settings.clearCache')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
