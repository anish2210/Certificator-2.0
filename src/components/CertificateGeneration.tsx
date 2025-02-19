import React, { useState } from 'react';
import { SheetData, MappedField } from '../types';
import JSZip from 'jszip';

type FileType = 'png' | 'jpg' | 'pdf';

interface Props {
  sheetData: SheetData;
  template: string;
  mappedFields: MappedField[];
  onBack: () => void;
}

const CertificateGeneration: React.FC<Props> = ({
  sheetData,
  template,
  mappedFields,
  onBack,
}) => {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [fileType, setFileType] = useState<FileType>('pdf');

  const generateCertificates = async () => {
    setGenerating(true);
    setProgress(0);

    try {
      const zip = new JSZip();
      const total = sheetData.rows.length;

      for (let i = 0; i < total; i++) {
        const row = sheetData.rows[i];
        // TODO: Implement actual certificate generation using canvas/PDF-lib
        // This is a mock implementation
        const certificateBlob = await mockGenerateCertificate(template, row, mappedFields, fileType);
        const fileName = `certificate_${i + 1}.${fileType}`;
        zip.file(fileName, certificateBlob);

        setProgress(((i + 1) / total) * 100);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificates.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating certificates:', error);
      alert('Failed to generate certificates. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Mock function to simulate certificate generation
  const mockGenerateCertificate = async (
    template: string,
    rowData: string[],
    fields: MappedField[],
    outputType: FileType
  ): Promise<Blob> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real implementation, this would create an actual certificate
        // using canvas or PDF-lib in the specified format
        const mockBlob = new Blob(['mock certificate data'], {
          type: outputType === 'pdf' ? 'application/pdf' : `image/${outputType}`,
        });
        resolve(mockBlob);
      }, 100);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Step 4: Generate Certificates</h2>
        <p className="text-gray-600 mb-4">
          Preview and generate certificates for all participants.
        </p>
      </div>

      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Preview</h3>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
            disabled={previewIndex === 0}
            className="bg-gray-200 px-4 py-2 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Entry {previewIndex + 1} of {sheetData.rows.length}
          </span>
          <button
            onClick={() =>
              setPreviewIndex(Math.min(sheetData.rows.length - 1, previewIndex + 1))
            }
            disabled={previewIndex === sheetData.rows.length - 1}
            className="bg-gray-200 px-4 py-2 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="space-y-2">
            {sheetData.headers.map((header, index) => (
              <div key={header} className="flex">
                <span className="font-semibold w-32">{header}:</span>
                <span>{sheetData.rows[previewIndex][index]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Output Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Output File Format
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  name="fileType"
                  value="pdf"
                  checked={fileType === 'pdf'}
                  onChange={(e) => setFileType(e.target.value as FileType)}
                />
                <span className="ml-2">PDF</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  name="fileType"
                  value="png"
                  checked={fileType === 'png'}
                  onChange={(e) => setFileType(e.target.value as FileType)}
                />
                <span className="ml-2">PNG</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  name="fileType"
                  value="jpg"
                  checked={fileType === 'jpg'}
                  onChange={(e) => setFileType(e.target.value as FileType)}
                />
                <span className="ml-2">JPG</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {generating && (
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-center text-gray-600">
            Generating certificates... {Math.round(progress)}%
          </div>
        </div>
      )}

      <div className="flex space-x-4">
        <button
          onClick={onBack}
          disabled={generating}
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={generateCertificates}
          disabled={generating}
          className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {generating ? 'Generating...' : `Generate All Certificates as ${fileType.toUpperCase()}`}
        </button>
      </div>
    </div>
  );
};

export default CertificateGeneration;
