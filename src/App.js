import React, { useEffect, useRef, useState } from 'react';
import { Canvas, Textbox, Rect, Circle, Triangle, Path, Image as FabricImage, Ellipse, Line } from 'fabric';
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
  const [isLandscape, setIsLandscape] = useState(false);
  const [fontStyle, setFontStyle] = useState({
    bold: false,
    italic: false,
    underline: false
  });
  const toggleOrientation = () => {
    if (!fabricCanvasRef.current) return;
    
    // Get the current canvas content as JSON
    const canvasJSON = fabricCanvasRef.current.toJSON();
    
    // Update dimensions
    fabricCanvasRef.current.setDimensions({
      width: !isLandscape ? 1280 : 720,
      height: !isLandscape ? 720 : 1280
    });
    
    // Load the saved content back
    fabricCanvasRef.current.loadFromJSON(canvasJSON, () => {
      fabricCanvasRef.current.requestRenderAll();
      setIsLandscape(!isLandscape);
    });
  };

  useEffect(() => {
    if (!canvasRef.current) {
      console.error('Canvas ref is not attached.');
      return;
    }
  
    const canvas = new Canvas(canvasRef.current, {
      width: isLandscape ? 1280 : 720,
      height: isLandscape ? 720 : 1280,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true
    });
  
    fabricCanvasRef.current = canvas;

    const handleResize = () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.setDimensions({
          width: isLandscape ? 1280 : 720,
          height: isLandscape ? 720 : 1280
        });
        fabricCanvasRef.current.requestRenderAll();
      }
    };

    window.addEventListener('resize', handleResize);

    const handleSelection = (e) => {
      if (!e || !e.target || !fabricCanvasRef.current) {
        console.log('No valid selection or canvas');
        setActiveObject(null);
        return;
      }

      const selected = e.target;

      // Ignore DOM elements (Fabric objects always have a 'type' property)
      if (!selected.type) {
        console.log('Ignoring non-Fabric object selection:', selected);
        setActiveObject(null);
        return;
      }

      console.log('Selected object:', selected);
      console.log('Object type:', selected.type);

      setActiveObject(selected);

      if (selected.type === 'textbox' || selected.type === 'text' || selected.type === 'i-text') {
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
  }, []); // Remove isLandscape from dependencies

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

  const addTriangle = () => {
    if (!fabricCanvasRef.current) return;
    const triangle = new Triangle({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: '#ffa500',
      stroke: '#000000',
      strokeWidth: 1,
      selectable: true
    });
    fabricCanvasRef.current.add(triangle);
    fabricCanvasRef.current.setActiveObject(triangle);
  };
  
  const addPolygon = (sides = 6) => {
    if (!fabricCanvasRef.current) return;
    
    const points = [];
    const radius = 50;
    const center = { x: radius, y: radius };
  
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides;
      points.push({
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle)
      });
    }
  
    const pathData = points.map((point, i) => 
      `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ') + ' Z';
  
    const polygon = new Path(pathData, {
      left: 100,
      top: 100,
      fill: '#9c27b0',
      stroke: '#000000',
      strokeWidth: 1,
      selectable: true,
      objectCaching: false
    });
  
    fabricCanvasRef.current.add(polygon);
    fabricCanvasRef.current.setActiveObject(polygon);
  };
  
  const addStar = (points = 5) => {
    if (!fabricCanvasRef.current) return;
    
    const outerRadius = 50;
    const innerRadius = 25;
    const center = { x: outerRadius, y: outerRadius };
    const path = [];
  
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      path.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
    }
  
    const star = new Path(path.join(' ') + ' Z', {
      left: 100,
      top: 100,
      fill: '#ffeb3b',
      stroke: '#000000',
      strokeWidth: 1,
      selectable: true,
      objectCaching: false
    });
  
    fabricCanvasRef.current.add(star);
    fabricCanvasRef.current.setActiveObject(star);
  };

  const addEllipse = () => {
    if (!fabricCanvasRef.current) return;
    const ellipse = new Ellipse({
      left: 100,
      top: 100,
      rx: 80,
      ry: 40,
      fill: '#2196f3',
      stroke: '#000000',
      strokeWidth: 1,
      selectable: true
    });
    fabricCanvasRef.current.add(ellipse);
    fabricCanvasRef.current.setActiveObject(ellipse);
  };
  const addLine = () => {
    if (!fabricCanvasRef.current) return;
    const line = new Line([50, 50, 200, 50], {
      left: 100,
      top: 100,
      stroke: '#000000',
      strokeWidth: 2,
      selectable: true
    });
    fabricCanvasRef.current.add(line);
    fabricCanvasRef.current.setActiveObject(line);
  };
  
  const addArrow = () => {
    if (!fabricCanvasRef.current) return;
    const path = new Path('M 0 0 L 200 0 L 190 -5 M 200 0 L 190 5', {
      left: 100,
      top: 100,
      stroke: '#000000',
      strokeWidth: 2,
      fill: '',
      selectable: true
    });
    fabricCanvasRef.current.add(path);
    fabricCanvasRef.current.setActiveObject(path);
  };
  
  const addDiamond = () => {
    if (!fabricCanvasRef.current) return;
    const diamond = new Path('M 50 0 L 100 50 L 50 100 L 0 50 Z', {
      left: 100,
      top: 100,
      fill: '#e91e63',
      stroke: '#000000',
      strokeWidth: 1,
      selectable: true
    });
    fabricCanvasRef.current.add(diamond);
    fabricCanvasRef.current.setActiveObject(diamond);
  };
  
  const addHeart = () => {
    if (!fabricCanvasRef.current) return;
    
    const heart = new Path(
      'M 10,30 \
       A 20,20 0 0,1 50,30 \
       A 20,20 0 0,1 90,30 \
       Q 90,60 50,90 \
       Q 10,60 10,30 z',
      {
        left: 100,
        top: 100,
        fill: '#f44336',
        stroke: '#000000',
        strokeWidth: 1,
        selectable: true,
        scaleX: 2,
        scaleY: 2,
        originX: 'center',
        originY: 'center'
      }
    );
  
    fabricCanvasRef.current.add(heart);
    fabricCanvasRef.current.setActiveObject(heart);
    fabricCanvasRef.current.requestRenderAll();
  };
  
  const addCross = () => {
    if (!fabricCanvasRef.current) return;
    const cross = new Path('M 40 0 L 60 0 L 60 40 L 100 40 L 100 60 L 60 60 L 60 100 L 40 100 L 40 60 L 0 60 L 0 40 L 40 40 Z', {
      left: 100,
      top: 100,
      fill: '#4caf50',
      stroke: '#000000',
      strokeWidth: 1,
      selectable: true
    });
    fabricCanvasRef.current.add(cross);
    fabricCanvasRef.current.setActiveObject(cross);
  };
  
  const addSpeechBubble = () => {
    if (!fabricCanvasRef.current) return;
    const bubble = new Path('M 10 0 Q 0 0 0 10 L 0 80 Q 0 90 10 90 L 70 90 Q 80 90 80 80 L 80 30 L 100 10 L 80 20 L 80 10 Q 80 0 70 0 Z', {
      left: 100,
      top: 100,
      fill: '#03a9f4',
      stroke: '#000000',
      strokeWidth: 1,
      selectable: true
    });
    fabricCanvasRef.current.add(bubble);
    fabricCanvasRef.current.setActiveObject(bubble);
  };

  const addImage = (e) => {
    if (!fabricCanvasRef.current) {
      console.error('Canvas is not initialized.');
      return;
    }

    const file = e.target.files[0];
    if (!file) {
      console.error('No file selected.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target.result;

      // Create a regular HTML image element first
      const imgElement = new Image();
      imgElement.src = data;

      imgElement.onload = () => {
        // Create Fabric image from the loaded image element
        const fabricImg = new FabricImage(imgElement, {
          left: 100,
          top: 100,
          selectable: true,
          hasControls: true,
          hasBorders: true,
          scaleX: 0.5, // Adjust scale as needed
          scaleY: 0.5  // Adjust scale as needed
        });

        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.add(fabricImg);
          fabricCanvasRef.current.setActiveObject(fabricImg);
          fabricCanvasRef.current.requestRenderAll();
          console.log('Image added to canvas successfully.');
        }
      };

      imgElement.onerror = (err) => {
        console.error('Error loading image:', err);
      };
    };

    reader.onerror = (err) => {
      console.error('Error reading file:', err);
    };

    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input to allow selecting the same file again
  };

  const deleteSelected = () => {
    if (!fabricCanvasRef.current) return;

    if (fabricCanvasRef.current.getActiveObjects().length > 0) {
      fabricCanvasRef.current.getActiveObjects().forEach((obj) => {
        fabricCanvasRef.current.remove(obj);
      });
      fabricCanvasRef.current.discardActiveObject();
      fabricCanvasRef.current.requestRenderAll(); // Use requestRenderAll() instead of renderAll()
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
    fabricCanvasRef.current.backgroundColor = '#ffffff';
    fabricCanvasRef.current.requestRenderAll();
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
  <div className="shapes-submenu">
    <button onClick={addRectangle}>Rectangle</button>
    <button onClick={addCircle}>Circle</button>
    <button onClick={addEllipse}>Ellipse</button>
    <button onClick={addTriangle}>Triangle</button>
    <button onClick={() => addPolygon(5)}>Pentagon</button>
    <button onClick={() => addPolygon(6)}>Hexagon</button>
    <button onClick={() => addPolygon(8)}>Octagon</button>
    <button onClick={() => addStar(5)}>Star</button>
    <button onClick={addDiamond}>Diamond</button>
    <button onClick={addHeart}>Heart</button>
    <button onClick={addLine}>Line</button>
    <button onClick={addArrow}>Arrow</button>
    <button onClick={addCross}>Cross</button>
    <button onClick={addSpeechBubble}>Speech Bubble</button>
  </div>
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

        {activeObject && (
  activeObject.type === 'rect' || 
  activeObject.type === 'circle' || 
  activeObject.type === 'triangle' || 
  activeObject.type === 'path') && (
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
          <button onClick={toggleOrientation}>
            {isLandscape ? "Switch to Portrait (720×1280)" : "Switch to Landscape (1280×720)"}
          </button>
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