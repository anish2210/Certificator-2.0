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
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [mappedFields, setMappedFields] = useState<MappedField[]>([]);

  useEffect(() => {
    if (canvasRef.current && !canvas) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
      });

      fabric.Image.fromURL(template, (img) => {
        fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas), {
          scaleX: fabricCanvas.width! / img.width!,
          scaleY: fabricCanvas.height! / img.height!,
        });
      });

      setCanvas(fabricCanvas);
    }
  }, [template, canvas]);

  const addTextField = () => {
    if (!canvas || !selectedColumn) return;

    const text = new fabric.IText(selectedColumn, {
      left: 100,
      top: 100,
      fontSize: 20,
      fill: '#000000',
      fontFamily: 'Arial',
    });

    canvas.add(text);
    canvas.setActiveObject(text);

    const newField: MappedField = {
      id: Date.now().toString(),
      sheetColumn: selectedColumn,
      position: { x: text.left!, y: text.top! },
      style: {
        fontSize: text.fontSize!,
        fontFamily: text.fontFamily!,
        color: text.fill as string,
      },
    };

    setMappedFields([...mappedFields, newField]);
  };

  const handleSave = () => {
    onFieldsMapped(mappedFields);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Step 3: Map Fields</h2>
        <p className="text-gray-600 mb-4">
          Select a column and click on the template to place the field.
        </p>
      </div>

      <div className="flex space-x-6">
        <div className="w-64 space-y-4">
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select a column</option>
            {sheetData.headers.map((header) => (
              <option key={header} value={header}>
                {header}
              </option>
            ))}
          </select>

          <button
            onClick={addTextField}
            disabled={!selectedColumn}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          >
            Add Field
          </button>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Mapped Fields:</h3>
            <ul className="space-y-2">
              {mappedFields.map((field) => (
                <li key={field.id} className="text-sm text-gray-600">
                  {field.sheetColumn}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex-1 border rounded-lg overflow-hidden">
          <canvas ref={canvasRef} />
        </div>
      </div>

      <div className="flex space-x-4">
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
          Next
        </button>
      </div>
    </div>
  );
};

export default FieldMapping;
