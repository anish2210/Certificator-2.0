import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';

interface Props {
  onTemplateUploaded: (templateUrl: string) => void;
  onBack: () => void;
}

const TemplateUpload: React.FC<Props> = ({ onTemplateUploaded, onBack }) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.match('image.*') && file.type !== 'application/pdf') {
      alert('Please upload an image (PNG, JPG) or PDF file');
      return;
    }

    setIsPdf(file.type === 'application/pdf');

    if (file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();
        
        if (pages.length > 0) {
          const firstPage = pages[0];
          const pngImage = await pdfDoc.saveAsBase64({ dataUri: true });
          setPreview(pngImage);
          onTemplateUploaded(pngImage);
        }
      } catch (error) {
        console.error('Error processing PDF:', error);
        alert('Error processing PDF file. Please try again.');
      }
    } else {
      // Handle image files
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        onTemplateUploaded(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Step 2: Upload Certificate Template</h2>
        <p className="text-gray-600 mb-4">
          Upload your certificate template in PNG, JPG, or PDF format.
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf"
          onChange={handleChange}
        />

        {preview ? (
          <div className="space-y-4">
            {isPdf ? (
              <embed
                src={preview}
                type="application/pdf"
                className="w-full h-96"
              />
            ) : (
              <img
                src={preview}
                alt="Template preview"
                className="max-h-96 mx-auto"
              />
            )}
            <button
              onClick={() => {
                setPreview(null);
                setIsPdf(false);
                if (inputRef.current) {
                  inputRef.current.value = '';
                }
              }}
              className="text-red-500 hover:text-red-600"
            >
              Remove template
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-gray-500">
              Drag and drop your template here, or
              <button
                onClick={() => inputRef.current?.click()}
                className="text-blue-500 hover:text-blue-600 ml-1"
              >
                browse
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onBack}
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
        >
          Back
        </button>
        {preview && (
          <button
            onClick={() => onTemplateUploaded(preview)}
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default TemplateUpload;
