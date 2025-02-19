import React, { useState } from 'react';
import SheetInput from './components/SheetInput';
import TemplateUpload from './components/TemplateUpload';
import FieldMapping from './components/FieldMapping';
import CertificateGeneration from './components/CertificateGeneration';
import { SheetData, MappedField } from './types';

const App: React.FC = () => {
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [template, setTemplate] = useState<string | null>(null);
  const [mappedFields, setMappedFields] = useState<MappedField[]>([]);
  const [step, setStep] = useState(1);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800">Certificate Generator</h1>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {step === 1 && (
            <SheetInput
              onDataFetched={(data) => {
                setSheetData(data);
                nextStep();
              }}
            />
          )}

          {step === 2 && (
            <TemplateUpload
              onTemplateUploaded={(templateUrl) => {
                setTemplate(templateUrl);
                nextStep();
              }}
              onBack={prevStep}
            />
          )}

          {step === 3 && sheetData && template && (
            <FieldMapping
              sheetData={sheetData}
              template={template}
              onFieldsMapped={(fields) => {
                setMappedFields(fields);
                nextStep();
              }}
              onBack={prevStep}
            />
          )}

          {step === 4 && sheetData && template && mappedFields.length > 0 && (
            <CertificateGeneration
              sheetData={sheetData}
              template={template}
              mappedFields={mappedFields}
              onBack={prevStep}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
