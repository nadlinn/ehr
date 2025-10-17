'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Home() {
  const [ehrName, setEhrName] = useState('');
  const [patientData, setPatientData] = useState({
    symptoms: '',
    familyHistory: '',
    medications: '',
  });
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('http://localhost:3001/ehr/send-patient-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ehrName,
          patientData,
        }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: 'Failed to send data' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            EHR Integration Platform
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Send patient data to various Electronic Health Record systems
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Patient Data Submission</CardTitle>
            <CardDescription>
              Select an EHR system and enter patient information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ehr-select">Select EHR System</Label>
                <Select onValueChange={setEhrName} value={ehrName}>
                  <SelectTrigger id="ehr-select">
                    <SelectValue placeholder="Choose an EHR system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EHR-A">EHR-A</SelectItem>
                    <SelectItem value="EHR-B">EHR-B</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="symptoms">Symptoms</Label>
                <Input
                  id="symptoms"
                  placeholder="Enter patient symptoms"
                  value={patientData.symptoms}
                  onChange={(e) =>
                    setPatientData({ ...patientData, symptoms: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="familyHistory">Family History</Label>
                <Input
                  id="familyHistory"
                  placeholder="Enter family history"
                  value={patientData.familyHistory}
                  onChange={(e) =>
                    setPatientData({ ...patientData, familyHistory: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medications">Medications</Label>
                <Input
                  id="medications"
                  placeholder="Enter current medications"
                  value={patientData.medications}
                  onChange={(e) =>
                    setPatientData({ ...patientData, medications: e.target.value })
                  }
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || !ehrName}>
                {loading ? 'Sending...' : 'Send Patient Data'}
              </Button>
            </form>

            {response && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold mb-2">Response:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>✓ Modular EHR integrations</li>
                <li>✓ Dynamic data mapping</li>
                <li>✓ Transactional integrity</li>
                <li>✓ Scalable architecture</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Supported EHRs</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• EHR-A</li>
                <li>• EHR-B</li>
                <li>• More coming soon...</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

