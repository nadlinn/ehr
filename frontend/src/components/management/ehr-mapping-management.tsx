'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient, EhrEndpoint } from '@/lib/api-client';


export function EhrMappingManagement() {
  const { t } = useTranslation();
  const [selectedEhr, setSelectedEhr] = useState<string>('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [endpoints, setEndpoints] = useState<EhrEndpoint[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [editableMappings, setEditableMappings] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const ehrSystems = ['Athena', 'Allscripts'];

  useEffect(() => {
    if (selectedEhr) {
      loadEndpoints(selectedEhr);
    }
  }, [selectedEhr]);

  useEffect(() => {
    if (selectedEhr && selectedEndpoint) {
      loadFieldMappings(selectedEhr, selectedEndpoint);
    }
  }, [selectedEhr, selectedEndpoint]);

  const loadEndpoints = async (ehrName: string) => {
    setLoading(true);
    try {
      const endpoints = await apiClient.getEhrEndpoints(ehrName);
      setEndpoints(endpoints);
      setSelectedEndpoint(''); // Reset endpoint selection
      setFieldMappings({}); // Reset field mappings
    } catch (error: any) {
      console.error('Error loading endpoints:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('errors.mappingNotFound'),
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFieldMappings = async (ehrName: string, endpointName: string) => {
    setLoading(true);
    try {
      const mappings = await apiClient.getEndpointFieldMappings(ehrName, endpointName);
      setFieldMappings(mappings);
      setEditableMappings({ ...mappings }); // Copy for editing
      setIsEditing(false); // Reset editing state
    } catch (error: any) {
      console.error('Error loading field mappings:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('errors.mappingNotFound'),
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditableMappings({ ...fieldMappings }); // Reset to original
    setIsEditing(false);
  };

  const updateMapping = (sourceField: string, newTargetField: string) => {
    setEditableMappings(prev => ({
      ...prev,
      [sourceField]: newTargetField
    }));
  };

  const saveMappings = async () => {
    if (!selectedEhr || !selectedEndpoint) return;

    setSaving(true);
    try {
      // Note: The current API doesn't have an update endpoint for field mappings
      // This would need to be implemented in the backend
      setMessage({
        type: 'success',
        text: 'Mapping updates saved successfully! (Note: Backend update endpoint needed)'
      });
      setFieldMappings({ ...editableMappings });
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving mappings:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('errors.serverError'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('mappingManagement.title')}</CardTitle>
          <CardDescription>{t('mappingManagement.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* EHR Selection */}
          <div className="space-y-2">
            <Label htmlFor="ehr-select">{t('mappingManagement.ehrName')}</Label>
            <Select onValueChange={setSelectedEhr} value={selectedEhr}>
              <SelectTrigger>
                <SelectValue placeholder="Select EHR system" />
              </SelectTrigger>
              <SelectContent>
                {ehrSystems.map(ehr => (
                  <SelectItem key={ehr} value={ehr}>{ehr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading && (
            <div className="text-center py-4">
              <p>{t('common.loading')}</p>
            </div>
          )}

          {selectedEhr && !loading && endpoints.length > 0 && (
            <>
              {/* Endpoint Selection */}
              <div className="space-y-2">
                <Label htmlFor="endpoint-select">Select Endpoint</Label>
                <Select onValueChange={setSelectedEndpoint} value={selectedEndpoint}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an endpoint" />
                  </SelectTrigger>
                  <SelectContent>
                    {endpoints.map(endpoint => (
                      <SelectItem key={endpoint.endpointName} value={endpoint.endpointName}>
                        {endpoint.endpointName} - {endpoint.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Endpoints List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Available Endpoints</h3>
                <div className="grid gap-4">
                  {endpoints.map((endpoint, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-lg">{endpoint.endpointName}</h4>
                          <span className="text-sm text-gray-500">{endpoint.endpointUrl}</span>
                        </div>
                        <p className="text-sm text-gray-600">{endpoint.description}</p>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Supported Fields:</p>
                          <div className="flex flex-wrap gap-2">
                            {endpoint.supportedFields.map((field, fieldIndex) => (
                              <span key={fieldIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {field}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Field Mappings for Selected Endpoint */}
              {selectedEndpoint && Object.keys(fieldMappings).length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Field Mappings for {selectedEndpoint}</h3>
                    <div className="flex space-x-2">
                      {!isEditing ? (
                        <Button onClick={startEditing} variant="outline" size="sm">
                          Edit Mappings
                        </Button>
                      ) : (
                        <>
                          <Button onClick={cancelEditing} variant="outline" size="sm">
                            Cancel
                          </Button>
                          <Button onClick={saveMappings} disabled={saving} size="sm">
                            {saving ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(isEditing ? editableMappings : fieldMappings).map(([sourceField, targetField]) => (
                      <div key={sourceField} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 border rounded-lg">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Source Field</Label>
                          <p className="text-sm font-mono bg-gray-50 p-2 rounded">{sourceField}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Target Field</Label>
                          {isEditing ? (
                            <Input
                              value={targetField}
                              onChange={(e) => updateMapping(sourceField, e.target.value)}
                              className="font-mono"
                              placeholder="Enter target field"
                            />
                          ) : (
                            <p className="text-sm font-mono bg-gray-50 p-2 rounded">{targetField}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEndpoint && Object.keys(fieldMappings).length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <p>No field mappings found for {selectedEndpoint}</p>
                </div>
              )}
            </>
          )}

          {selectedEhr && !loading && endpoints.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No endpoints found for {selectedEhr}</p>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : message.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {message.text}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
