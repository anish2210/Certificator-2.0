import React, { useState, useRef, useEffect } from 'react';
import { fabric } from 'fabric';
import { SheetData, MappedField } from '../types';

interface Props {
  sheetData: SheetData;
  template: string;
  onFieldsMapped: (mappedFields: MappedField[]) => void;
  onBack: () => void;
}

const FieldMapping: React.FC<Props> = ({ sheetData, template, onFieldsMapped, onBack }) => {
  const [mappedFields, setMappedFields] = useState<MappedField[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  // Initialize canvas when component mounts
  useEffect(() => {
    const initCanvas = async () => {
      if (canvasRef.current && !fabricCanvasRef.current) {
        // Create fabric canvas
        const canvas = new fabric.Canvas(canvasRef.current, {
          width: 800,
          height: 600,
          backgroundColor: 'white',
          preserveObjectStacking: true
        });

        fabricCanvasRef.current = canvas;

        // Load template image
        try {
          const img = await new Promise<fabric.Image>((resolve, reject) => {
            fabric.Image.fromURL(
              template,
              (img) => {
                if (!img) {
                  reject(new Error('Failed to load image'));
                  return;
                }
                resolve(img);
              },
              { crossOrigin: 'anonymous' }
            );
          });

          // Calculate dimensions
          const canvasWidth = canvas.width ?? 800;
          const canvasHeight = canvas.height ?? 600;
          const imgWidth = img.width ?? 0;
          const imgHeight = img.height ?? 0;

          // Calculate scaling to fit canvas while maintaining aspect ratio
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
            selectable: false,
            evented: false
          });

          // Set background and render
          canvas.setBackgroundImage(img, () => {
            canvas.renderAll();
          });

          // Handle object modifications
          canvas.on('object:modified', (e) => {
            const target = e.target as fabric.Text;
            if (!target) return;

            const header = target.get('data')?.header;
            if (!header) return;

            const fieldIndex = mappedFields.findIndex(
              (field) => field.sheetColumn === header
            );

            if (fieldIndex !== -1) {
              const updatedFields = [...mappedFields];
              updatedFields[fieldIndex] = {
                ...updatedFields[fieldIndex],
                position: {
                  x: Math.round(target.left ?? 0),
                  y: Math.round(target.top ?? 0)
                },
                style: {
                  fontSize: Math.round(target.getFontSize() ?? 20),
                  fontFamily: target.getFontFamily() ?? 'Arial',
                  color: target.getFill()?.toString() ?? '#000000'
                }
              };
              setMappedFields(updatedFields);
            }
          });
        } catch (error) {
          console.error('Error loading template:', error);
        }
      }
    };

    initCanvas();

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [template]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, header: string) => {
    e.dataTransfer.setData('text/plain', header);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const header = e.dataTransfer.getData('text/plain');
    
    if (!fabricCanvasRef.current || !canvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const rect = canvasRef.current.getBoundingClientRect();
    const pointer = canvas.getPointer(e);

    // Remove existing field if it exists
    const existingFieldIndex = mappedFields.findIndex(
      (field) => field.sheetColumn === header
    );

    if (existingFieldIndex !== -1) {
      const existingObjects = canvas.getObjects();
      const existingText = existingObjects.find(
        (obj) => obj.get('data')?.header === header
      );
      if (existingText) {
        canvas.remove(existingText);
      }
    }

    // Create new text object
    const text = new fabric.Text(header, {
      left: pointer.x,
      top: pointer.y,
      fontSize: 20,
      fontFamily: 'Arial',
      fill: '#000000',
      data: { header },
      hasControls: true,
      hasBorders: true,
      lockRotation: true,
      cornerSize: 8,
      transparentCorners: false,
      borderColor: '#2196F3',
      cornerColor: '#2196F3'
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();

    // Update mapped fields
    const newField: MappedField = {
      sheetColumn: header,
      position: {
        x: Math.round(pointer.x),
        y: Math.round(pointer.y)
      },
      style: {
        fontSize: 20,
        fontFamily: 'Arial',
        color: '#000000'
      }
    };

    if (existingFieldIndex !== -1) {
      const updatedFields = [...mappedFields];
      updatedFields[existingFieldIndex] = newField;
      setMappedFields(updatedFields);
    } else {
      setMappedFields([...mappedFields, newField]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Step 3: Map Fields</h2>
        <p className="text-gray-600 mb-4">
          Drag and drop fields onto the template. You can resize and move fields after placing them.
        </p>
      </div>

      <div className="flex space-x-6">
        <div className="w-1/4">
          <h3 className="text-lg font-semibold mb-4">Available Fields</h3>
          <div className="space-y-2">
            {sheetData.headers.map((header) => (
              <div
                key={header}
                draggable
                onDragStart={(e) => handleDragStart(e, header)}
                className={`p-2 border rounded cursor-move hover:bg-gray-50 ${
                  mappedFields.some((field) => field.sheetColumn === header)
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white'
                }`}
              >
                {header}
              </div>
            ))}
          </div>
        </div>

        <div className="w-3/4">
          <div 
            className="border rounded-lg p-4 bg-white"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <canvas ref={canvasRef} style={{ width: '100%', height: '600px' }} />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
        >
          Back
        </button>
        <button
          onClick={() => onFieldsMapped(mappedFields)}
          disabled={mappedFields.length === 0}
          className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default FieldMapping;
