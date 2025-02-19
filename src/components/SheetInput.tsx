import React, { useState } from 'react';
import { SheetData } from '../types';

interface Props {
  onDataFetched: (data: SheetData) => void;
}

const SheetInput: React.FC<Props> = ({ onDataFetched }) => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState<SheetData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // TODO: Replace with actual Google Sheets API integration
      const mockData: SheetData = {
        headers: ['Name', 'Course', 'Date', 'Grade', 'Certificate ID', 'Email'],
        rows: [
          ['John Doe', 'Web Development', '2024-02-19', 'A', 'CERT001', 'john@example.com'],
          ['Jane Smith', 'Data Science', '2024-02-19', 'A+', 'CERT002', 'jane@example.com'],
          ['Bob Wilson', 'Mobile Development', '2024-02-19', 'B+', 'CERT003', 'bob@example.com'],
        ],
      };
      
      setPreviewData(mockData);
    } catch (err) {
      setError('Failed to fetch sheet data. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (previewData) {
      onDataFetched(previewData);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Step 1: Enter Google Sheet URL</h2>
        <p className="text-gray-600 mb-4">
          Paste the URL of your Google Sheet containing the certificate data.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Loading...' : 'Fetch Data'}
        </button>
      </form>

      {previewData && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Preview Data</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  {previewData.headers.map((header, index) => (
                    <th
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {previewData.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setPreviewData(null)}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
            >
              Clear Data
            </button>
            <button
              onClick={handleConfirm}
              className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
            >
              Confirm and Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SheetInput;
