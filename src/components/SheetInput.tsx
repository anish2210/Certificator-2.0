import React, { useState, useEffect } from 'react';
import { SheetData } from '../types';

// Get API key from environment
const getApiKey = () => {
  const env = import.meta.env;
  return env?.VITE_GOOGLE_API_KEY || '';
};

interface Props {
  onDataFetched: (data: SheetData) => void;
}

const SheetInput: React.FC<Props> = ({ onDataFetched }) => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState<SheetData | null>(null);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const key = getApiKey();
    if (!key) {
      setError('Google Sheets API key is not configured. Please check your environment variables.');
      console.error('Missing VITE_GOOGLE_API_KEY environment variable');
    } else {
      setApiKey(key);
    }
  }, []);

  // Extract sheet ID from Google Sheets URL
  const extractSheetId = (url: string): string | null => {
    try {
      const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
      const match = url.match(regex);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey) {
      setError('Google Sheets API key is not configured. Please check your environment variables.');
      return;
    }

    setLoading(true);
    setError('');
    setPreviewData(null);

    const sheetId = extractSheetId(sheetUrl);
    if (!sheetId) {
      setError('Invalid Google Sheets URL. Please check the URL and try again.');
      setLoading(false);
      return;
    }

    try {
      console.log('Making API request...');
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:Z1000?key=${apiKey}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.values || data.values.length < 2) {
        throw new Error('Sheet is empty or has insufficient data');
      }

      const sheetData: SheetData = {
        headers: data.values[0],
        rows: data.values.slice(1),
      };

      setPreviewData(sheetData);
    } catch (err) {
      console.error('Error fetching sheet data:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch sheet data. Please check the URL and ensure the sheet is publicly accessible.'
      );
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
          Make sure the sheet is publicly accessible (View access).
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
          disabled={loading || !apiKey}
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
