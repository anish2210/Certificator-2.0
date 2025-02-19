import React, { useState, useRef, useEffect } from 'react';
import { SheetData, MappedField } from '../types';
import JSZip from 'jszip';
import { fabric } from 'fabric';
import { PDFDocument } from 'pdf-lib';

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
  const [previewCanvas, setPreviewCanvas] = useState<fabric.Canvas | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize preview canvas when component mounts
  useEffect(() => {
    if (previewCanvasRef.current && !previewCanvas) {
      const canvas = new fabric.Canvas(previewCanvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: 'white',
        selection: false
      });
      setPreviewCanvas(canvas);
    }
  }, []);

  // Update preview when canvas is set or when index/template/fields change
  useEffect(() => {
    if (previewCanvas) {
      updatePreview();
    }
  }, [previewCanvas, previewIndex, template, mappedFields]);

  const updatePreview = async () => {
    if (!previewCanvas) return;

    // Clear canvas
    previewCanvas.clear();

    // Load template image
    fabric.Image.fromURL(template, (img) => {
      if (!img) return;

      const canvasWidth = previewCanvas.width ?? 800;
      const canvasHeight = previewCanvas.height ?? 600;
      const imgWidth = img.width ?? 0;
      const imgHeight = img.height ?? 0;

      // Calculate scaling
      const scaleX = canvasWidth / imgWidth;
      const scaleY = canvasHeight / imgHeight;
      const scale = Math.min(scaleX, scaleY);

      // Center the image
      const left = (canvasWidth - imgWidth * scale) / 2;
      const top = (canvasHeight - imgHeight * scale) / 2;

      img.set({
        scaleX: scale,
        scaleY: scale,
        left,
        top,
        selectable: false
      });

      previewCanvas.setBackgroundImage(img, () => {
        // Add mapped fields
        const rowData = sheetData.rows[previewIndex];
        mappedFields.forEach((field) => {
          const columnIndex = sheetData.headers.indexOf(field.sheetColumn);
          if (columnIndex !== -1) {
            const text = new fabric.Text(rowData[columnIndex], {
              left: field.position.x,
              top: field.position.y,
              fontSize: field.style.fontSize,
              fontFamily: field.style.fontFamily,
              fill: field.style.color,
              selectable: false
            });
            previewCanvas.add(text);
          }
        });
        previewCanvas.renderAll();
      });
    });
  };

  const generateCertificate = async (
    templateUrl: string,
    rowData: string[],
    fields: MappedField[],
    outputType: FileType
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        // Create a temporary canvas element
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 800;
        tempCanvas.height = 600;

        // Create fabric canvas
        const fabricCanvas = new fabric.Canvas(tempCanvas);
        fabricCanvas.backgroundColor = 'white';

        // Load template image
        fabric.Image.fromURL(templateUrl, (img) => {
          if (!img) {
            reject(new Error('Failed to load template image'));
            return;
          }

          const canvasWidth = fabricCanvas.width ?? 800;
          const canvasHeight = fabricCanvas.height ?? 600;
          const imgWidth = img.width ?? 0;
          const imgHeight = img.height ?? 0;

          // Calculate scaling
          const scaleX = canvasWidth / imgWidth;
          const scaleY = canvasHeight / imgHeight;
          const scale = Math.min(scaleX, scaleY);

          // Center the image
          const left = (canvasWidth - imgWidth * scale) / 2;
          const top = (canvasHeight - imgHeight * scale) / 2;

          img.set({
            scaleX: scale,
            scaleY: scale,
            left,
            top,
            selectable: false
          });

          fabricCanvas.setBackgroundImage(img, async () => {
            try {
              // Add text fields
              fields.forEach((field) => {
                const columnIndex = sheetData.headers.indexOf(field.sheetColumn);
                if (columnIndex !== -1) {
                  const text = new fabric.Text(rowData[columnIndex], {
                    left: field.position.x,
                    top: field.position.y,
                    fontSize: field.style.fontSize,
                    fontFamily: field.style.fontFamily,
                    fill: field.style.color,
                    selectable: false
                  });
                  fabricCanvas.add(text);
                }
              });

              fabricCanvas.renderAll();

              if (outputType === 'pdf') {
                const dataUrl = fabricCanvas.toDataURL({
                  format: 'png',
                  quality: 1
                });

                const pdfDoc = await PDFDocument.create();
                const page = pdfDoc.addPage([canvasWidth, canvasHeight]);
                
                const base64Data = dataUrl.split(',')[1];
                const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                const image = await pdfDoc.embedPng(imageBytes);
                
                page.drawImage(image, {
                  x: 0,
                  y: 0,
                  width: page.getWidth(),
                  height: page.getHeight()
                });

                const pdfBytes = await pdfDoc.save();
                resolve(new Blob([pdfBytes], { type: 'application/pdf' }));
              } else {
                fabricCanvas.toBlob((blob) => {
                  if (blob) {
                    resolve(blob);
                  } else {
                    reject(new Error('Failed to create image blob'));
                  }
                }, `image/${outputType === 'jpg' ? 'jpeg' : outputType}`);
              }
            } catch (error) {
              reject(error);
            } finally {
              fabricCanvas.dispose();
            }
          });
        }, (error) => {
          reject(new Error(`Failed to load template image: ${error}`));
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  const generateCertificates = async () => {
    setGenerating(true);
    setProgress(0);

    try {
      const zip = new JSZip();
      const total = sheetData.rows.length;

      for (let i = 0; i < total; i++) {
        const row = sheetData.rows[i];
        const certificateBlob = await generateCertificate(template, row, mappedFields, fileType);
        const fileName = `certificate_${i + 1}.${fileType}`;
        zip.file(fileName, certificateBlob);
        setProgress(((i + 1) / total) * 100);
      }

      const content = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        }
      });

      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'certificates.zip';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating certificates:', error);
      alert(`Failed to generate certificates: ${error.message}`);
    } finally {
      setGenerating(false);
    }
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
        <div className="border rounded-lg p-4 mb-4 bg-white flex justify-center">
          <canvas ref={previewCanvasRef} className="max-w-full" />
        </div>
        <div className="space-y-2">
          {sheetData.headers.map((header, index) => (
            <div key={header} className="flex">
              <span className="font-semibold w-32">{header}:</span>
              <span>{sheetData.rows[previewIndex][index]}</span>
            </div>
          ))}
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

      <div className="flex justify-between">
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
