'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient, TransactionLog } from '@/lib/api-client';

export function TransactionManagement() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<TransactionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterEhr, setFilterEhr] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const ehrSystems = ['Athena', 'Allscripts'];
  const statuses = ['pending', 'mapped', 'queued', 'success', 'failed', 'retrying'];

  useEffect(() => {
    loadTransactions();
  }, [filterEhr, filterStatus]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const transactions = await apiClient.getTransactionLogs(
        filterEhr && filterEhr !== 'all' ? filterEhr : undefined,
        filterStatus && filterStatus !== 'all' ? filterStatus : undefined
      );
      setTransactions(transactions);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || t('errors.serverError') 
      });
    } finally {
      setLoading(false);
    }
  };

  const retryTransaction = async (transactionId: number) => {
    try {
      await apiClient.retryTransaction(transactionId);
      setMessage({ type: 'success', text: t('success.transactionRetried') });
      loadTransactions(); // Refresh the list
    } catch (error) {
      console.error('Error retrying transaction:', error);
      setMessage({ type: 'error', text: t('errors.serverError') });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'mapped':
        return 'bg-yellow-100 text-yellow-800';
      case 'queued':
        return 'bg-blue-100 text-blue-800';
      case 'retrying':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('transactionManagement.title')}</CardTitle>
          <CardDescription>{t('transactionManagement.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-ehr">{t('transactionManagement.filterByEhr')}</Label>
              <Select onValueChange={setFilterEhr} value={filterEhr}>
                <SelectTrigger>
                  <SelectValue placeholder={t('transactionManagement.allEhrs')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('transactionManagement.allEhrs')}</SelectItem>
                  {ehrSystems.map(ehr => (
                    <SelectItem key={ehr} value={ehr}>{ehr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-status">{t('transactionManagement.filterByStatus')}</Label>
              <Select onValueChange={setFilterStatus} value={filterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder={t('transactionManagement.allStatuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('transactionManagement.allStatuses')}</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {t(`transactionStatus.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Actions</Label>
              <Button onClick={loadTransactions} variant="outline" className="w-full">
                {t('common.refresh')}
              </Button>
            </div>
          </div>

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

          {/* Transactions Table */}
          {loading ? (
            <div className="text-center py-8">
              <p>{t('common.loading')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No transactions found
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <Card key={transaction.id} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                        <div>
                          <p className="text-sm font-medium">{t('transactionManagement.transactionId')}</p>
                          <p className="text-sm text-gray-600">#{transaction.id}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium">{t('transactionManagement.ehrName')}</p>
                          <p className="text-sm text-gray-600">{transaction.ehrName}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium">{t('transactionManagement.status')}</p>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {t(`transactionStatus.${transaction.status}`)}
                          </span>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium">{t('transactionManagement.createdAt')}</p>
                          <p className="text-sm text-gray-600">{formatDate(transaction.createdAt)}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium">{t('transactionManagement.retryCount')}</p>
                          <p className="text-sm text-gray-600">{transaction.retryCount}</p>
                        </div>
                        
                        <div className="flex space-x-2">
                          {transaction.status === 'failed' && (
                            <Button
                              onClick={() => retryTransaction(transaction.id)}
                              size="sm"
                              variant="outline"
                            >
                              {t('common.retry')}
                            </Button>
                          )}
                          <Button
                            onClick={() => {
                              // TODO: Implement view details functionality
                              console.log('View details for transaction:', transaction.id);
                            }}
                            size="sm"
                            variant="outline"
                          >
                            {t('transactionManagement.viewDetails')}
                          </Button>
                        </div>
                      </div>
                      
                      {transaction.errorMessage && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                          <strong>Error:</strong> {transaction.errorMessage}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
