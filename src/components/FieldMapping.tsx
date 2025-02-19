import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { SheetData, MappedField } from '../types';

interface Props {
  sheetData: SheetData;
  template: string;
  onFieldsMapped: (fields: MappedField[]) => void;
  onBack: () => void;
}

const FieldMapping: React.FC<Props> = ({
  sheetData,
  template,
  onFieldsMapped,
  onBack,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [mappedFields, setMappedFields] = useState<MappedField[]>([]);
  const dragItemRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (canvasRef.current && !canvas) {
      // Initialize canvas with basic settings
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        selection: true,
        preserveObjectStacking: true,
      });

      // Load template image
      fabric.Image.fromURL(template, (img) => {
        // Calculate dimensions to maintain aspect ratio
        const imgWidth = img.width ?? 0;
        const imgHeight = img.height ?? 0;
        const canvasWidth = fabricCanvas.width ?? 800;
        const canvasHeight = fabricCanvas.height ?? 600;

        // Calculate aspect ratios
        const imgAspectRatio = imgWidth / imgHeight;
        const canvasAspectRatio = canvasWidth / canvasHeight;

        let scaleX, scaleY, left = 0, top = 0;

        if (imgAspectRatio > canvasAspectRatio) {
          // Image is wider than canvas (relative to height)
          scaleX = canvasWidth / imgWidth;
          scaleY = scaleX;
          top = (canvasHeight - (imgHeight * scaleY)) / 2;
        } else {
          // Image is taller than canvas (relative to width)
          scaleY = canvasHeight / imgHeight;
          scaleX = scaleY;
          left = (canvasWidth - (imgWidth * scaleX)) / 2;
        }

        // Set image properties
        img.set({
          scaleX: scaleX,
          scaleY: scaleY,
          left: left,
          top: top,
          originX: 'left',
          originY: 'top',
        });

        // Set as background
        fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas));

        // Adjust canvas container size to match image aspect ratio
        const container = canvasRef.current?.parentElement;
        if (container) {
          container.style.width = '100%';
          container.style.height = '600px';
          container.style.display = 'flex';
          container.style.alignItems = 'center';
          container.style.justifyContent = 'center';
        }
      });

      // Update object on modification
      fabricCanvas.on('object:modified', (e) => {
        const obj = e.target as fabric.IText;
        if (obj && obj.text) {
          const fieldIndex = mappedFields.findIndex(
            (field) => field.sheetColumn === obj.text
          );
          if (fieldIndex !== -1) {
            const updatedFields = [...mappedFields];
            updatedFields[fieldIndex] = {
              ...updatedFields[fieldIndex],
              position: { x: obj.left ?? 0, y: obj.top ?? 0 },
              style: {
                fontSize: obj.fontSize ?? 20,
                fontFamily: obj.fontFamily ?? 'Arial',
                color: obj.fill?.toString() ?? '#000000',
              },
            };
            setMappedFields(updatedFields);
          }
        }
      });

      setCanvas(fabricCanvas);
    }
  }, [template]);

  const createText = (text: string, left: number, top: number) => {
    return new fabric.IText(text, {
      left,
      top,
      fontSize: 20,
      fill: '#000000',
      fontFamily: 'Arial',
      hasControls: true,
      hasBorders: true,
      selectable: true,
      editable: true,
      centeredScaling: true,
      borderColor: '#2196F3',
      cornerColor: '#2196F3',
      cornerSize: 12,
      transparentCorners: false,
      padding: 10,
    });
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, column: string) => {
    e.dataTransfer.setData('text/plain', column);
    if (dragItemRef.current) {
      dragItemRef.current.style.opacity = '0.5';
    }
  };

  const handleDragEnd = () => {
    if (dragItemRef.current) {
      dragItemRef.current.style.opacity = '1';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const column = e.dataTransfer.getData('text/plain');
    if (!canvas || !column) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const text = createText(column, x, y);
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();

    const newField: MappedField = {
      id: Date.now().toString(),
      sheetColumn: column,
      position: { x, y },
      style: {
        fontSize: 20,
        fontFamily: 'Arial',
        color: '#000000',
      },
    };

    setMappedFields([...mappedFields, newField]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSave = () => {
    onFieldsMapped(mappedFields);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Step 3: Map Fields</h2>
        <p className="text-gray-600 mb-4">
          Drag and drop fields from the list onto the template to place them.
          You can move, resize, and rotate fields after placing them.
        </p>
      </div>

      <div className="flex space-x-6">
        <div className="w-64">
          <div className="p-4 border border-gray-200 rounded-lg bg-white">
            <h3 className="font-semibold mb-3">Available Fields</h3>
            <div className="space-y-2">
              {sheetData.headers.map((header) => (
                <div
                  key={header}
                  draggable
                  onDragStart={(e) => handleDragStart(e, header)}
                  onDragEnd={handleDragEnd}
                  ref={dragItemRef}
                  className="p-2 bg-gray-100 rounded cursor-move hover:bg-gray-200 transition-colors"
                >
                  {header}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="flex-1 border border-gray-300 rounded-lg overflow-hidden"
          style={{ minHeight: '600px', position: 'relative' }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <canvas ref={canvasRef} />
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
          onClick={handleSave}
          disabled={mappedFields.length === 0}
          className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
        >
          Save and Continue
        </button>
      </div>
    </div>
  );
};

export default FieldMapping;
