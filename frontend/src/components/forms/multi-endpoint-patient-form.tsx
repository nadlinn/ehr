'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { apiClient, EhrEndpoint, MultiEndpointSubmissionResult } from '@/lib/api-client';
import { Loader2, CheckCircle, XCircle, Info } from 'lucide-react';

// Enhanced patient data schema with all medical fields
const multiEndpointPatientDataSchema = z.object({
  ehrName: z.string().min(1, 'EHR system is required'),
  language: z.string().default('en'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  age: z.number().min(0).max(150),
  gender: z.string().min(1, 'Gender is required'),
  contact: z.object({
    email: z.string().email('Invalid email address'),
    phone: z.string().min(1, 'Phone number is required'),
    address: z.string().optional(),
  }),
  // Medical History Fields
  medicalHistory: z.string().optional(),
  socialHistory: z.string().optional(),
  familyHistory: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  symptoms: z.array(z.string()).optional(),
  // Additional Fields
  bloodType: z.string().optional(),
  maritalStatus: z.string().optional(),
  emergencyContact: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  primaryCarePhysician: z.string().optional(),
  // Multi-endpoint specific
  targetEndpoints: z.array(z.string()).optional(),
  submissionMode: z.enum(['sync', 'async']).default('sync'),
});

type MultiEndpointPatientData = z.infer<typeof multiEndpointPatientDataSchema>;

interface MultiEndpointPatientFormProps {
  onSuccess?: (result: MultiEndpointSubmissionResult) => void;
  onError?: (error: string) => void;
}

export function MultiEndpointPatientForm({ onSuccess, onError }: MultiEndpointPatientFormProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableEndpoints, setAvailableEndpoints] = useState<EhrEndpoint[]>([]);
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([]);
  const [endpointMappings, setEndpointMappings] = useState<Record<string, Record<string, string>>>({});
  const [showEndpointDetails, setShowEndpointDetails] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<MultiEndpointPatientData>({
    resolver: zodResolver(multiEndpointPatientDataSchema),
    defaultValues: {
      language: 'en',
      submissionMode: 'sync',
      allergies: [],
      medications: [],
      symptoms: [],
    },
  });

  const watchedEhrName = watch('ehrName');
  const watchedSubmissionMode = watch('submissionMode');

  // Load available endpoints when EHR is selected
  const loadEndpoints = async (ehrName: string) => {
    try {
      const endpoints = await apiClient.getEhrEndpoints(ehrName);
      setAvailableEndpoints(endpoints);
      
      // Load field mappings for each endpoint
      const mappings: Record<string, Record<string, string>> = {};
      for (const endpoint of endpoints) {
        try {
          const mapping = await apiClient.getEndpointFieldMappings(ehrName, endpoint.endpointName);
          mappings[endpoint.endpointName] = mapping;
        } catch (error) {
          console.warn(`Failed to load mappings for ${endpoint.endpointName}:`, error);
        }
      }
      setEndpointMappings(mappings);
    } catch (error) {
      console.error('Failed to load endpoints:', error);
    }
  };

  // Handle endpoint selection
  const handleEndpointToggle = (endpointName: string, checked: boolean) => {
    if (checked) {
      setSelectedEndpoints(prev => [...prev, endpointName]);
    } else {
      setSelectedEndpoints(prev => prev.filter(name => name !== endpointName));
    }
  };

  // Auto-select endpoints based on available data
  const autoSelectEndpoints = () => {
    const formData = watch();
    const autoSelected: string[] = [];
    
    availableEndpoints.forEach(endpoint => {
      const hasRelevantData = endpoint.supportedFields.some(field => {
        const value = getNestedValue(formData, field);
        return value !== undefined && value !== null && value !== '';
      });
      
      if (hasRelevantData) {
        autoSelected.push(endpoint.endpointName);
      }
    });
    
    setSelectedEndpoints(autoSelected);
  };

  // Helper function to get nested values
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const onSubmit = async (data: MultiEndpointPatientData) => {
    setIsSubmitting(true);
    try {
      const requestData = {
        ...data,
        targetEndpoints: selectedEndpoints.length > 0 ? selectedEndpoints : undefined,
      };

      let result: MultiEndpointSubmissionResult | any;
      
      if (data.submissionMode === 'sync') {
        result = await apiClient.sendPatientDataToMultipleEndpoints(requestData);
      } else {
        result = await apiClient.sendPatientDataToMultipleEndpointsAsync(requestData);
      }

      onSuccess?.(result);
      reset();
      setSelectedEndpoints([]);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Multi-Endpoint Patient Data Submission</CardTitle>
          <CardDescription>
            Submit patient data to multiple EHR endpoints with smart routing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* EHR Selection and Language */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ehrName">EHR System</Label>
                <Select
                  onValueChange={(value) => {
                    setValue('ehrName', value);
                    loadEndpoints(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select EHR system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Athena">Athena Health</SelectItem>
                    <SelectItem value="Allscripts">Allscripts Healthcare</SelectItem>
                  </SelectContent>
                </Select>
                {errors.ehrName && (
                  <p className="text-sm text-red-600 mt-1">{errors.ehrName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="language">Language</Label>
                <Select onValueChange={(value) => setValue('language', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="submissionMode">Submission Mode</Label>
                <Select onValueChange={(value: 'sync' | 'async') => setValue('submissionMode', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sync">Synchronous</SelectItem>
                    <SelectItem value="async">Asynchronous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Basic Patient Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input {...register('firstName')} />
                  {errors.firstName && (
                    <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input {...register('lastName')} />
                  {errors.lastName && (
                    <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    type="number"
                    {...register('age', { valueAsNumber: true })}
                  />
                  {errors.age && (
                    <p className="text-sm text-red-600 mt-1">{errors.age.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select onValueChange={(value) => setValue('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-sm text-red-600 mt-1">{errors.gender.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact.email">Email</Label>
                  <Input {...register('contact.email')} type="email" />
                  {errors.contact?.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.contact.email.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="contact.phone">Phone</Label>
                  <Input {...register('contact.phone')} />
                  {errors.contact?.phone && (
                    <p className="text-sm text-red-600 mt-1">{errors.contact.phone.message}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="contact.address">Address</Label>
                  <Input {...register('contact.address')} />
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Medical History</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="medicalHistory">Medical History</Label>
                  <Textarea
                    {...register('medicalHistory')}
                    placeholder="Previous surgeries, conditions, etc."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="socialHistory">Social History</Label>
                  <Textarea
                    {...register('socialHistory')}
                    placeholder="Smoking, alcohol, occupation, etc."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="familyHistory">Family History</Label>
                  <Textarea
                    {...register('familyHistory')}
                    placeholder="Family medical conditions"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="symptoms">Current Symptoms</Label>
                  <Textarea
                    {...register('symptoms')}
                    placeholder="Enter symptoms separated by commas"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Endpoint Selection */}
            {availableEndpoints.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Endpoint Selection</h3>
                  <div className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={autoSelectEndpoints}
                    >
                      Auto-Select
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEndpointDetails(!showEndpointDetails)}
                    >
                      {showEndpointDetails ? 'Hide' : 'Show'} Details
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableEndpoints.map((endpoint) => (
                    <div key={endpoint.endpointName} className="border rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={endpoint.endpointName}
                          checked={selectedEndpoints.includes(endpoint.endpointName)}
                          onCheckedChange={(checked) =>
                            handleEndpointToggle(endpoint.endpointName, checked as boolean)
                          }
                        />
                        <Label htmlFor={endpoint.endpointName} className="font-medium">
                          {endpoint.endpointName.replace(/_/g, ' ').toUpperCase()}
                        </Label>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{endpoint.description}</p>
                      
                      {showEndpointDetails && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium text-gray-500">Supported Fields:</p>
                          <div className="flex flex-wrap gap-1">
                            {endpoint.supportedFields.map((field) => (
                              <span
                                key={field}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                              >
                                {field}
                              </span>
                            ))}
                          </div>
                          {endpointMappings[endpoint.endpointName] && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-500">Field Mappings:</p>
                              <div className="text-xs text-gray-600">
                                {Object.entries(endpointMappings[endpoint.endpointName]).map(([field, mapping]) => (
                                  <div key={field} className="flex justify-between">
                                    <span>{field}:</span>
                                    <span className="font-mono">{mapping}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {selectedEndpoints.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Selected {selectedEndpoints.length} endpoint(s): {selectedEndpoints.join(', ')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setSelectedEndpoints([]);
                }}
              >
                Reset
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {watchedSubmissionMode === 'sync' ? 'Submitting...' : 'Queuing...'}
                  </>
                ) : (
                  watchedSubmissionMode === 'sync' ? 'Submit Synchronously' : 'Submit Asynchronously'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
