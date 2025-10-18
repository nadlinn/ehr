'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { apiClient, PatientData, SendPatientDataRequest } from '@/lib/api-client';

// Validation schema
const patientDataSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  age: z.number().min(0).max(150, 'Age must be between 0 and 150'),
  gender: z.string().min(1, 'Gender is required'),
  contact: z.object({
    email: z.string().email('Invalid email address'),
    phone: z.string().min(1, 'Phone number is required'),
    address: z.string().optional(),
  }),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  medicalHistory: z.string().optional(),
  socialHistory: z.string().optional(),
  familyHistory: z.string().optional(),
  symptoms: z.array(z.string()).optional(),
  bloodType: z.string().optional(),
  maritalStatus: z.string().optional(),
  emergencyContact: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  primaryCarePhysician: z.string().optional(),
});

type PatientDataFormData = z.infer<typeof patientDataSchema>;

interface PatientDataFormProps {
  onSubmit: (data: SendPatientDataRequest) => Promise<void>;
  loading?: boolean;
}

export function PatientDataForm({ onSubmit, loading = false }: PatientDataFormProps) {
  const { t } = useTranslation();
  const [allergies, setAllergies] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newSymptom, setNewSymptom] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PatientDataFormData>({
    resolver: zodResolver(patientDataSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      age: 0,
      gender: '',
      contact: {
        email: '',
        phone: '',
        address: '',
      },
      allergies: [],
      medications: [],
      medicalHistory: {},
      symptoms: [],
    },
  });

  const watchedValues = watch();

  const addItem = (item: string, setter: (items: string[]) => void, field: keyof PatientDataFormData) => {
    if (item.trim()) {
      const newItems = [...(watchedValues[field] as string[] || []), item.trim()];
      setter(newItems);
      setValue(field, newItems);
    }
  };

  const removeItem = (index: number, setter: (items: string[]) => void, field: keyof PatientDataFormData) => {
    const newItems = (watchedValues[field] as string[] || []).filter((_, i) => i !== index);
    setter(newItems);
    setValue(field, newItems);
  };

  const handleFormSubmit = async (data: PatientDataFormData) => {
    const request: SendPatientDataRequest = {
      ehrName: watchedValues.ehrName || '',
      patientData: data as PatientData,
      language: watchedValues.language || 'en',
    };
    await onSubmit(request);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{t('patientForm.title')}</CardTitle>
        <CardDescription>{t('patientForm.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* EHR Selection and Processing Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ehrName">{t('patientForm.selectEhr')}</Label>
              <Select onValueChange={(value) => setValue('ehrName', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('patientForm.selectEhrPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Athena">{t('ehrSystems.athena')}</SelectItem>
                  <SelectItem value="Allscripts">{t('ehrSystems.allscripts')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">{t('patientForm.language')}</Label>
              <Select onValueChange={(value) => setValue('language', value)} defaultValue="en">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('patientForm.firstName')}</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                placeholder={t('patientForm.firstName')}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">{t('patientForm.lastName')}</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                placeholder={t('patientForm.lastName')}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">{t('patientForm.age')}</Label>
              <Input
                id="age"
                type="number"
                {...register('age', { valueAsNumber: true })}
                placeholder={t('patientForm.age')}
              />
              {errors.age && (
                <p className="text-sm text-red-500">{errors.age.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">{t('patientForm.gender')}</Label>
              <Select onValueChange={(value) => setValue('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('patientForm.gender')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t('genders.male')}</SelectItem>
                  <SelectItem value="female">{t('genders.female')}</SelectItem>
                  <SelectItem value="other">{t('genders.other')}</SelectItem>
                  <SelectItem value="prefer-not-to-say">{t('genders.preferNotToSay')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-sm text-red-500">{errors.gender.message}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('patientForm.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('contact.email')}
                  placeholder={t('patientForm.email')}
                />
                {errors.contact?.email && (
                  <p className="text-sm text-red-500">{errors.contact.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('patientForm.phone')}</Label>
                <Input
                  id="phone"
                  {...register('contact.phone')}
                  placeholder={t('patientForm.phone')}
                />
                {errors.contact?.phone && (
                  <p className="text-sm text-red-500">{errors.contact.phone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t('patientForm.address')}</Label>
              <Textarea
                id="address"
                {...register('contact.address')}
                placeholder={t('patientForm.address')}
                rows={2}
              />
            </div>
          </div>

          {/* Allergies */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('patientForm.allergies')}</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Add allergy"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    addItem(newAllergy, setAllergies, 'allergies');
                    setNewAllergy('');
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allergies.map((allergy, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-md text-sm"
                  >
                    {allergy}
                    <button
                      type="button"
                      onClick={() => removeItem(index, setAllergies, 'allergies')}
                      className="ml-1 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Medications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('patientForm.medications')}</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  placeholder="Add medication"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    addItem(newMedication, setMedications, 'medications');
                    setNewMedication('');
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {medications.map((medication, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                  >
                    {medication}
                    <button
                      type="button"
                      onClick={() => removeItem(index, setMedications, 'medications')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Symptoms */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('patientForm.symptoms')}</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newSymptom}
                  onChange={(e) => setNewSymptom(e.target.value)}
                  placeholder="Add symptom"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    addItem(newSymptom, setSymptoms, 'symptoms');
                    setNewSymptom('');
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {symptoms.map((symptom, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm"
                  >
                    {symptom}
                    <button
                      type="button"
                      onClick={() => removeItem(index, setSymptoms, 'symptoms')}
                      className="ml-1 text-yellow-600 hover:text-yellow-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Medical History */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Medical History</h3>
            <div className="space-y-2">
              <Label htmlFor="medicalHistory">Previous medical conditions, surgeries, injuries</Label>
              <Textarea
                id="medicalHistory"
                {...register('medicalHistory')}
                placeholder="e.g., Previous abdominal surgery (2020), History of diabetes, Chest pain episodes"
                rows={3}
              />
            </div>
          </div>

          {/* Social History */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Social History</h3>
            <div className="space-y-2">
              <Label htmlFor="socialHistory">Lifestyle factors, habits, occupation</Label>
              <Textarea
                id="socialHistory"
                {...register('socialHistory')}
                placeholder="e.g., Non-smoker, Occasional alcohol use, Office worker, Recent travel to Europe"
                rows={3}
              />
            </div>
          </div>

          {/* Family History */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Family History</h3>
            <div className="space-y-2">
              <Label htmlFor="familyHistory">Family medical conditions</Label>
              <Textarea
                id="familyHistory"
                {...register('familyHistory')}
                placeholder="e.g., Mother: diabetes, Father: heart disease, Grandmother: breast cancer"
                rows={3}
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bloodType">Blood Type</Label>
                <Select {...register('bloodType')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maritalStatus">Marital Status</Label>
                <Select {...register('maritalStatus')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                    <SelectItem value="separated">Separated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  {...register('emergencyContact')}
                  placeholder="Name and phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryCarePhysician">Primary Care Physician</Label>
                <Input
                  id="primaryCarePhysician"
                  {...register('primaryCarePhysician')}
                  placeholder="Dr. Smith, Internal Medicine"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                <Input
                  id="insuranceProvider"
                  {...register('insuranceProvider')}
                  placeholder="Blue Cross Blue Shield"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurancePolicyNumber">Insurance Policy Number</Label>
                <Input
                  id="insurancePolicyNumber"
                  {...register('insurancePolicyNumber')}
                  placeholder="Policy number"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => reset()}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('patientForm.submitting') : t('patientForm.submitData')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
