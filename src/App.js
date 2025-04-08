import React, { useEffect, useRef, useState } from 'react';
import { Canvas, Textbox, Rect, Circle, Image } from 'fabric';
import './App.css';

// Common fonts list
const FONTS = [
  'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Helvetica', 'Comic Sans MS', 'Impact', 'Tahoma', 'Trebuchet MS'
];

function App() {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [activeObject, setActiveObject] = useState(null);
  const [textAlign, setTextAlign] = useState('left');
  const [fontStyle, setFontStyle] = useState({
    bold: false,
    italic: false,
    underline: false
  });

  useEffect(() => {
    const canvas = new Canvas('canvas', {
      width: window.innerWidth - 250,
      height: window.innerHeight - 100,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true
    });

    fabricCanvasRef.current = canvas;

    const handleSelection = (e) => {
      if (!e || !e.target || !fabricCanvasRef.current) {
        console.log('No valid selection or canvas');
        setActiveObject(null);
        return;
      }

      const selected = e.target;
      console.log('Selected object:', selected);
      console.log('Object type:', selected.type);

      if (selected && selected.type) {
        setActiveObject(selected);

        if (selected.type === 'textbox' || selected.type === 'text' || selected.type === 'i-text') {
          console.log('Text object selected:', selected);
          setTextAlign(selected.textAlign || 'left');
          setFontStyle({
            bold: selected.fontWeight === 'bold',
            italic: selected.fontStyle === 'italic',
            underline: selected.underline || false
          });

          selected.set({
            selectable: true,
            editable: true
          });

          fabricCanvasRef.current.requestRenderAll();
        }
      }
    };

    canvas.on('selection:created', (e) => {
      if (e.selected && e.selected.length > 0) {
        handleSelection({ target: e.selected[0] });
      } else if (e.target) {
        handleSelection(e);
      }
    });

    canvas.on('selection:updated', (e) => {
      if (e.selected && e.selected.length > 0) {
        handleSelection({ target: e.selected[0] });
      } else if (e.target) {
        handleSelection(e);
      }
    });

    canvas.on('selection:cleared', () => {
      console.log('Selection cleared');
      setActiveObject(null);
      setTextAlign('left');
      setFontStyle({ bold: false, italic: false, underline: false });
    });

    canvas.on('text:changed', (e) => {
      if (e.target && fabricCanvasRef.current) {
        console.log('Text changed:', e.target);
        fabricCanvasRef.current.requestRenderAll();
      }
    });

    const handleResize = () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.setDimensions({
          width: window.innerWidth - 250,
          height: window.innerHeight - 100
        });
      }
    };
    window.addEventListener('resize', handleResize);

    // Expose handleSelection to be used by addText
    canvas.handleSelection = handleSelection;

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.off('selection:created');
      canvas.off('selection:updated');
      canvas.off('selection:cleared');
      canvas.off('text:changed');
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  const addText = () => {
    if (!fabricCanvasRef.current) return;

    const text = new Textbox('Double click to edit', {
      left: 100,
      top: 100,
      width: 200,
      fontFamily: 'Arial',
      fontSize: 20,
      fill: '#000000',
      padding: 5,
      editable: true,
      textAlign: 'left',
      selectable: true,
      hasControls: true,
      hasBorders: true
    });

    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    if (fabricCanvasRef.current.handleSelection) {
      fabricCanvasRef.current.handleSelection({ target: text });
    }
    fabricCanvasRef.current.requestRenderAll();
  };

  const addRectangle = () => {
    if (!fabricCanvasRef.current) return;
    const rect = new Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: '#ff0000',
      stroke: '#000000',
      strokeWidth: 1,
      selectable: true
    });
    fabricCanvasRef.current.add(rect);
    fabricCanvasRef.current.setActiveObject(rect);
  };

  const addCircle = () => {
    if (!fabricCanvasRef.current) return;
    const circle = new Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: '#00ff00',
      stroke: '#000000',
      strokeWidth: 1,
      selectable: true
    });
    fabricCanvasRef.current.add(circle);
    fabricCanvasRef.current.setActiveObject(circle);
  };

  const addImage = (e) => {
    if (!fabricCanvasRef.current) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (f) => {
      Image.fromURL(f.target.result, (img) => {
        img.scaleToWidth(200);
        fabricCanvasRef.current.add(img);
        fabricCanvasRef.current.setActiveObject(img);
      });
    };
    reader.readAsDataURL(file);
  };

  const deleteSelected = () => {
    if (!fabricCanvasRef.current) return;
    if (fabricCanvasRef.current.getActiveObjects().length > 0) {
      fabricCanvasRef.current.getActiveObjects().forEach((obj) => {
        fabricCanvasRef.current.remove(obj);
      });
      fabricCanvasRef.current.discardActiveObject().renderAll();
    }
  };

  const downloadCanvas = () => {
    if (!fabricCanvasRef.current) return;
    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1
    });
    const link = document.createElement('a');
    link.download = 'canvas-design.png';
    link.href = dataURL;
    link.click();
  };

  const clearCanvas = () => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.clear();
    fabricCanvasRef.current.setBackgroundColor('#ffffff', fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current));
  };

  const updateTextStyle = (style, value) => {
    if (!fabricCanvasRef.current || !activeObject || !(
      activeObject.type === 'textbox' ||
      activeObject.type === 'text' ||
      activeObject.type === 'i-text' ||
      activeObject instanceof Textbox
    )) return;

    console.log('Updating text style:', style, value);

    switch (style) {
      case 'bold':
        activeObject.set('fontWeight', value ? 'bold' : 'normal');
        setFontStyle(prev => ({ ...prev, bold: value }));
        break;
      case 'italic':
        activeObject.set('fontStyle', value ? 'italic' : 'normal');
        setFontStyle(prev => ({ ...prev, italic: value }));
        break;
      case 'underline':
        activeObject.set('underline', value);
        setFontStyle(prev => ({ ...prev, underline: value }));
        break;
      case 'align':
        activeObject.set('textAlign', value);
        setTextAlign(value);
        break;
      case 'font':
        activeObject.set('fontFamily', value);
        break;
      case 'size':
        activeObject.set('fontSize', parseInt(value));
        break;
      case 'color':
        activeObject.set('fill', value);
        break;
      case 'lineHeight':
        activeObject.set('lineHeight', parseFloat(value));
        break;
      case 'charSpacing':
        activeObject.set('charSpacing', parseInt(value));
        break;
      case 'backgroundColor':
        activeObject.set('backgroundColor', value);
        break;
      default:
        break;
    }
    fabricCanvasRef.current.requestRenderAll();
  };

  const updateShapeStyle = (style, value) => {
    if (!fabricCanvasRef.current || !activeObject) return;
    console.log('Updating shape style:', style, value);

    switch (style) {
      case 'fill':
        activeObject.set('fill', value);
        break;
      case 'stroke':
        activeObject.set('stroke', value);
        break;
      case 'strokeWidth':
        activeObject.set('strokeWidth', parseInt(value));
        break;
      case 'opacity':
        activeObject.set('opacity', parseFloat(value));
        break;
      default:
        break;
    }
    fabricCanvasRef.current.requestRenderAll();
  };

  // The JSX return remains exactly the same as in your current code
  return (
    <div className="app-container">
      <div className="toolbar">
        <h3>Tools</h3>
        <div className="tool-section">
          <button onClick={addText}>Add Text</button>
          <button onClick={addRectangle}>Add Rectangle</button>
          <button onClick={addCircle}>Add Circle</button>
        </div>

        {activeObject && (
          activeObject.type === 'textbox' ||
          activeObject.type === 'text' ||
          activeObject.type === 'i-text' ||
          activeObject instanceof Textbox
        ) && (
          <div className="text-formatting">
            <div className="tool-section">
              <label>Font Family</label>
              <select
                value={activeObject.fontFamily}
                onChange={(e) => updateTextStyle('font', e.target.value)}
              >
                {FONTS.map(font => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </select>

              <label>Font Size</label>
              <input
                type="number"
                value={activeObject.fontSize}
                onChange={(e) => updateTextStyle('size', e.target.value)}
                min="8"
                max="200"
              />

              <label>Line Height</label>
              <input
                type="number"
                value={activeObject.lineHeight || 1}
                onChange={(e) => updateTextStyle('lineHeight', e.target.value)}
                min="0.1"
                max="10"
                step="0.1"
              />

              <label>Letter Spacing</label>
              <input
                type="number"
                value={activeObject.charSpacing || 0}
                onChange={(e) => updateTextStyle('charSpacing', e.target.value)}
                min="-100"
                max="1000"
              />

              <div className="text-controls">
                <button
                  className={fontStyle.bold ? 'active' : ''}
                  onClick={() => updateTextStyle('bold', !fontStyle.bold)}
                  title="Bold"
                >
                  B
                </button>
                <button
                  className={fontStyle.italic ? 'active' : ''}
                  onClick={() => updateTextStyle('italic', !fontStyle.italic)}
                  title="Italic"
                >
                  I
                </button>
                <button
                  className={fontStyle.underline ? 'active' : ''}
                  onClick={() => updateTextStyle('underline', !fontStyle.underline)}
                  title="Underline"
                >
                  U
                </button>
              </div>

              <div className="text-align">
                <button
                  className={textAlign === 'left' ? 'active' : ''}
                  onClick={() => updateTextStyle('align', 'left')}
                  title="Align Left"
                >
                  ←
                </button>
                <button
                  className={textAlign === 'center' ? 'active' : ''}
                  onClick={() => updateTextStyle('align', 'center')}
                  title="Align Center"
                >
                  ↔
                </button>
                <button
                  className={textAlign === 'right' ? 'active' : ''}
                  onClick={() => updateTextStyle('align', 'right')}
                  title="Align Right"
                >
                  →
                </button>
              </div>
            </div>

            <div className="tool-section">
              <label>Text Color</label>
              <input
                type="color"
                value={activeObject.fill}
                onChange={(e) => updateTextStyle('color', e.target.value)}
              />

              <label>Background Color</label>
              <input
                type="color"
                value={activeObject.backgroundColor || '#ffffff'}
                onChange={(e) => updateTextStyle('backgroundColor', e.target.value)}
              />
            </div>
          </div>
        )}

        {activeObject && (activeObject.type === 'rect' || activeObject.type === 'circle') && (
          <div className="shape-formatting tool-section">
            <label>Fill Color</label>
            <input
              type="color"
              value={activeObject.fill}
              onChange={(e) => updateShapeStyle('fill', e.target.value)}
            />

            <label>Stroke Color</label>
            <input
              type="color"
              value={activeObject.stroke}
              onChange={(e) => updateShapeStyle('stroke', e.target.value)}
            />

            <label>Stroke Width</label>
            <input
              type="number"
              value={activeObject.strokeWidth}
              onChange={(e) => updateShapeStyle('strokeWidth', e.target.value)}
              min="0"
              max="50"
            />

            <label>Opacity</label>
            <input
              type="range"
              value={activeObject.opacity || 1}
              onChange={(e) => updateShapeStyle('opacity', e.target.value)}
              min="0"
              max="1"
              step="0.1"
            />
          </div>
        )}

        <div className="tool-section">
          <label>Upload Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={addImage}
          />
        </div>

        <div className="tool-section">
          <button onClick={deleteSelected} disabled={!activeObject}>
            Delete Selected
          </button>
          <button onClick={downloadCanvas}>Download as PNG</button>
          <button onClick={clearCanvas}>Clear Canvas</button>
        </div>
      </div>
      <div className="canvas-container">
        <canvas ref={canvasRef} id="canvas" />
      </div>
    </div>
  );
}

export default App;