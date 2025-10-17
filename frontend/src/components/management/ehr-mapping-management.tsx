'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiClient, EhrMapping } from '@/lib/api-client';

interface MappingField {
  sourceField: string;
  targetField: string;
}

export function EhrMappingManagement() {
  const { t } = useTranslation();
  const [selectedEhr, setSelectedEhr] = useState<string>('');
  const [mapping, setMapping] = useState<EhrMapping | null>(null);
  const [mappingFields, setMappingFields] = useState<MappingField[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const ehrSystems = ['Athena', 'Allscripts'];

  useEffect(() => {
    if (selectedEhr) {
      loadMapping(selectedEhr);
    }
  }, [selectedEhr]);

  const loadMapping = async (ehrName: string) => {
    setLoading(true);
    try {
      const mapping = await apiClient.getEhrMapping(ehrName);
      setMapping(mapping);
      
      // Convert mapping config to editable fields
      const fields: MappingField[] = [];
      if (mapping.mappingConfig?.patient) {
        Object.entries(mapping.mappingConfig.patient).forEach(([source, target]) => {
          fields.push({
            sourceField: source,
            targetField: target as string,
          });
        });
      }
      setMappingFields(fields);
    } catch (error) {
      console.error('Error loading mapping:', error);
      setMessage({ type: 'error', text: t('errors.mappingNotFound') });
    } finally {
      setLoading(false);
    }
  };

  const addMappingField = () => {
    setMappingFields([...mappingFields, { sourceField: '', targetField: '' }]);
  };

  const removeMappingField = (index: number) => {
    setMappingFields(mappingFields.filter((_, i) => i !== index));
  };

  const updateMappingField = (index: number, field: keyof MappingField, value: string) => {
    const updated = [...mappingFields];
    updated[index][field] = value;
    setMappingFields(updated);
  };

  const saveMapping = async () => {
    if (!selectedEhr) return;

    setSaving(true);
    try {
      // Convert fields back to mapping config
      const mappingConfig: Record<string, any> = {
        patient: {},
      };

      mappingFields.forEach(field => {
        if (field.sourceField && field.targetField) {
          mappingConfig.patient[field.sourceField] = field.targetField;
        }
      });

      const updatedMapping: EhrMapping = {
        ehrName: selectedEhr,
        mappingConfig,
      };

      await apiClient.saveEhrMapping(updatedMapping);
      setMessage({ type: 'success', text: t('success.mappingSaved') });
    } catch (error) {
      console.error('Error saving mapping:', error);
      setMessage({ type: 'error', text: t('errors.serverError') });
    } finally {
      setSaving(false);
    }
  };

  const testMapping = () => {
    // TODO: Implement mapping test functionality
    setMessage({ type: 'info', text: 'Mapping test functionality coming soon...' });
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

          {selectedEhr && !loading && (
            <>
              {/* Field Mappings */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{t('mappingManagement.fieldMapping')}</h3>
                  <Button onClick={addMappingField} variant="outline" size="sm">
                    {t('mappingManagement.addMapping')}
                  </Button>
                </div>

                <div className="space-y-3">
                  {mappingFields.map((field, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="space-y-2">
                        <Label htmlFor={`source-${index}`}>{t('mappingManagement.sourceField')}</Label>
                        <Input
                          id={`source-${index}`}
                          value={field.sourceField}
                          onChange={(e) => updateMappingField(index, 'sourceField', e.target.value)}
                          placeholder="e.g., firstName"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`target-${index}`}>{t('mappingManagement.targetField')}</Label>
                        <Input
                          id={`target-${index}`}
                          value={field.targetField}
                          onChange={(e) => updateMappingField(index, 'targetField', e.target.value)}
                          placeholder="e.g., PATIENT_FIRST_NAME"
                        />
                      </div>
                      <Button
                        onClick={() => removeMappingField(index)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-800"
                      >
                        {t('mappingManagement.removeMapping')}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <Button onClick={testMapping} variant="outline">
                  {t('mappingManagement.testMapping')}
                </Button>
                <Button onClick={saveMapping} disabled={saving}>
                  {saving ? t('common.loading') : t('mappingManagement.saveMapping')}
                </Button>
              </div>
            </>
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

      {/* Current Mapping Display */}
      {mapping && (
        <Card>
          <CardHeader>
            <CardTitle>Current Mapping Configuration</CardTitle>
            <CardDescription>JSON representation of the current mapping</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={JSON.stringify(mapping.mappingConfig, null, 2)}
              readOnly
              rows={10}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
