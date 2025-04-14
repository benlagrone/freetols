import React, { useRef, useState, useEffect } from 'react';
import {
  Canvas,
  Textbox,
  Rect,
  Circle,
  Triangle,
  Path,
  Image as FabricImage,
  Ellipse,
  Line,
  ActiveSelection,
  Group,
  util // Add this line to access fabric.util
} from 'fabric';
import './App.css';
import ReactGA from 'react-ga4';

// Initialize with your GA4 measurement ID
ReactGA.initialize('G-LJBMXKDXY9');

// Track a page view
ReactGA.send({ hitType: "pageview", page: window.location.pathname + window.location.search });

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

  const [canvasScale, setCanvasScale] = useState(1);


  const handleScaleChange = (newScale) => {
    if (!fabricCanvasRef.current) return;

    // Store current canvas state
    const objects = fabricCanvasRef.current.getObjects();
    const activeObject = fabricCanvasRef.current.getActiveObject();
    const viewportTransform = fabricCanvasRef.current.viewportTransform;

    // Calculate new dimensions
    const width = isLandscape ? 1280 : 720;
    const height = isLandscape ? 720 : 1280;

    // Set new dimensions
    fabricCanvasRef.current.setDimensions({
      width: width * newScale,
      height: height * newScale
    });

    // Scale all objects proportionally
    const scaleRatio = newScale / canvasScale;
    objects.forEach(obj => {
      obj.scaleX = obj.scaleX * scaleRatio;
      obj.scaleY = obj.scaleY * scaleRatio;
      obj.left = obj.left * scaleRatio;
      obj.top = obj.top * scaleRatio;
      obj.setCoords();
    });

    // Restore viewport state
    fabricCanvasRef.current.setZoom(newScale);
    if (viewportTransform) {
      fabricCanvasRef.current.viewportTransform = [...viewportTransform];
    }

    // Restore active object
    if (activeObject) {
      fabricCanvasRef.current.setActiveObject(activeObject);
    }

    fabricCanvasRef.current.requestRenderAll();
    setCanvasScale(newScale);
  };

  const safeCanvasOperation = async (operation) => {
    if (!fabricCanvasRef.current) return;

    try {
      // Disable rendering during batch operations
      fabricCanvasRef.current.renderOnAddRemove = false;
      await operation();
    } catch (error) {
      console.error('Canvas operation failed:', error);
      throw error;
    } finally {
      // Always re-enable rendering
      fabricCanvasRef.current.renderOnAddRemove = true;
      fabricCanvasRef.current.requestRenderAll();
    }
  };



  // Keep the wrapper functions simple
  const switchToLandscape = () => {
    console.log('Attempting to switch to landscape');
    switchOrientation(true);
  };

  const switchToPortrait = () => {
    console.log('Attempting to switch to portrait');
    switchOrientation(false);
  };

  const handleOrientationSwitch = async (newIsLandscape) => {
    try {
      await switchOrientation(newIsLandscape);
    } catch (error) {
      // Implement your error UI here
      console.error("Orientation switch failed:", error);
    }
  };

  const saveCanvasState = () => {
    if (!fabricCanvasRef.current) return;
    const objects = fabricCanvasRef.current.getObjects().map(obj => obj.toObject());
    console.log('Saving objects:', objects); // Log objects being saved
    if (objects.length > 0) {
      localStorage.setItem('canvasState', JSON.stringify(objects));
    } else {
      console.log('No objects to save.');
    }
  };


  useEffect(() => {
    if (!canvasRef.current) return;

    let canvas = fabricCanvasRef.current;

    if (canvas) {
      canvas.renderOnAddRemove = false;
      canvas.dispose();
      canvas = null;
    }

    const baseWidth = isLandscape ? 1280 : 720;
    const baseHeight = isLandscape ? 720 : 1280;
    const width = baseWidth * canvasScale;
    const height = baseHeight * canvasScale;

    const newCanvas = new Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      selection: true,
      selectionColor: 'rgba(100, 100, 255, 0.3)',
      preserveObjectStacking: true
    });

    fabricCanvasRef.current = newCanvas;

    newCanvas.set({
      transparentCorners: false,
      borderColor: 'rgba(100, 100, 255, 0.8)',
      cornerColor: 'rgba(100, 100, 255, 0.8)',
      cornerStyle: 'circle',
      objectCaching: false
    });



    newCanvas.setZoom(canvasScale);

    const storedObjects = JSON.parse(localStorage.getItem('canvasState') || '[]');
    console.log('Loading objects:', storedObjects);



    util.enlivenObjects(storedObjects).then((enlivenedObjects) => {
      enlivenedObjects.forEach(enlivenedObj => {
        enlivenedObj.set({
          visible: true,
          opacity: 1
        });
        newCanvas.add(enlivenedObj);
        console.log('Object added to canvas:', enlivenedObj);
      });
      newCanvas.requestRenderAll();
    }).catch((error) => {
      console.error('Error enlivening objects:', error);
    });

    const handleSelection = (e) => {
      const activeObj = e?.selected?.[0] || e?.target || newCanvas.getActiveObject();
      setActiveObject(activeObj || null);

      if (activeObj?.type?.includes('text')) {
        setTextAlign(activeObj.textAlign || 'left');
        setFontStyle({
          bold: activeObj.fontWeight === 'bold',
          italic: activeObj.fontStyle === 'italic',
          underline: activeObj.underline || false
        });
      }
    };

    newCanvas.on('selection:created', handleSelection);
    newCanvas.on('selection:updated', handleSelection);
    newCanvas.on('selection:cleared', () => {
      setActiveObject(null);
      setTextAlign('left');
      setFontStyle({ bold: false, italic: false, underline: false });
    });

    // Automatically save canvas state on object changes
    const autoSaveCanvas = () => {
      saveCanvasState();
    };

    newCanvas.on('object:added', autoSaveCanvas);
    newCanvas.on('object:modified', autoSaveCanvas);
    newCanvas.on('object:removed', autoSaveCanvas);

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.off();
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [isLandscape, canvasScale]);

  const switchOrientation = (newIsLandscape) => {
    if (!fabricCanvasRef.current) return;

    try {
      const canvas = fabricCanvasRef.current;

      // Store current objects and their relative positions
      const objects = canvas.getObjects().map(obj => ({
        object: obj,
        relativeX: obj.left / canvas.width,
        relativeY: obj.top / canvas.height
      }));

      // Calculate new dimensions
      const newWidth = newIsLandscape ? 1280 : 720;
      const newHeight = newIsLandscape ? 720 : 1280;

      // Set new dimensions
      canvas.setDimensions({
        width: newWidth * canvasScale,
        height: newHeight * canvasScale
      });

      // Reposition objects using relative positions
      objects.forEach(({ object, relativeX, relativeY }) => {
        object.set({
          left: relativeX * (newWidth * canvasScale),
          top: relativeY * (newHeight * canvasScale)
        });
        object.setCoords();
      });

      // Update state and render
      setIsLandscape(newIsLandscape);
      canvas.requestRenderAll();

    } catch (error) {
      console.error('Error during orientation switch:', error);
    }
  };


  const addText = () => {
    if (!fabricCanvasRef.current) return;

    const text = new Textbox('Double click to edit', {  // Remove fabric. prefix
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
      hasBorders: true,
      lockUniScaling: false,
      lockScalingFlip: true,
      editingBorderColor: 'rgba(100, 100, 255, 0.8)',
      borderColor: 'rgba(100, 100, 255, 0.8)',
      cornerColor: 'rgba(100, 100, 255, 0.8)',
      cornerStyle: 'circle',
      objectCaching: false
    });

    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    text.enterEditing(); // Start editing immediately
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
    console.log('Rectangle added:', rect); // Log the added object
    // saveCanvasState(); 

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
    console.log('Circle added:', circle); // Log the added object
    // saveCanvasState(); 
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
    // saveCanvasState(); 
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

  const addDonut = () => {
    if (!fabricCanvasRef.current) return;

    // Create outer circle
    const outerCircle = new Circle({
      radius: 50,
      fill: '#e91e63',
      stroke: '#000000',
      strokeWidth: 1,
      left: 0,    // position relative to group
      top: 0,
      selectable: true
    });

    // Create inner circle (hole)
    const innerCircle = new Circle({
      radius: 25,
      fill: '#ffffff',  // white fill for the hole
      stroke: '#000000',
      strokeWidth: 1,
      left: 25,   // center in the outer circle (50 - 25 = 25)
      top: 25,    // center in the outer circle
      selectable: true
    });

    // Create a group with both circles
    const donut = new Group([outerCircle, innerCircle], {
      left: 100,
      top: 100,
      selectable: true
    });

    // Add the grouped donut to canvas
    fabricCanvasRef.current.add(donut);
    fabricCanvasRef.current.setActiveObject(donut);
    fabricCanvasRef.current.requestRenderAll();
  };

  const addCloud = () => {
    if (!fabricCanvasRef.current) return;
    const cloud = new Path(
      'M 25,60 C -10,60 -10,30 5,30 C 5,10 35,10 40,30 C 60,15 85,30 85,45 C 85,55 75,60 60,60 Z',
      {
        left: 100,
        top: 100,
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 1,
        selectable: true,
        scaleX: 1.5,
        scaleY: 1.5
      }
    );
    fabricCanvasRef.current.add(cloud);
    fabricCanvasRef.current.setActiveObject(cloud);
  };

  const addStarburst = () => {
    if (!fabricCanvasRef.current) return;
    const points = 16;
    const outerRadius = 50;
    const innerRadius = 25;
    let path = `M ${outerRadius} 0`;

    for (let i = 1; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI * i) / points;
      path += ` L ${r * Math.cos(angle)} ${r * Math.sin(angle)}`;
    }
    path += ' Z';

    const starburst = new Path(path, {
      left: 100,
      top: 100,
      fill: '#ffd700',
      stroke: '#000000',
      strokeWidth: 1,
      selectable: true
    });
    fabricCanvasRef.current.add(starburst);
    fabricCanvasRef.current.setActiveObject(starburst);
  };

  const addGear = () => {
    if (!fabricCanvasRef.current) return;
    const teeth = 12;
    const radius = 50;
    const internalRadius = radius * 0.8;
    const toothDepth = radius * 0.2;
    let path = '';

    for (let i = 0; i < teeth; i++) {
      const angle = (i * 2 * Math.PI) / teeth;
      const nextAngle = ((i + 1) * 2 * Math.PI) / teeth;
      const midAngle = (angle + nextAngle) / 2;

      path += `${i === 0 ? 'M' : 'L'} ${(radius + toothDepth) * Math.cos(midAngle)} ${(radius + toothDepth) * Math.sin(midAngle)}`;
      path += ` L ${radius * Math.cos(nextAngle)} ${radius * Math.sin(nextAngle)}`;
    }
    path += ' Z';

    const gear = new Path(path, {
      left: 100,
      top: 100,
      fill: '#808080',
      stroke: '#000000',
      strokeWidth: 1,
      selectable: true
    });
    fabricCanvasRef.current.add(gear);
    fabricCanvasRef.current.setActiveObject(gear);
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


  const addSmiley = () => {
    if (!fabricCanvasRef.current) return;

    // Base position for the smiley
    const centerX = 150;
    const centerY = 150;

    // Create face circle
    const face = new Circle({
      left: centerX - 50, // radius is 50, so offset by that amount
      top: centerY - 50,
      radius: 50,
      fill: '#ffeb3b',
      stroke: '#000000',
      strokeWidth: 1,
      selectable: true
    });

    // Create eyes
    const leftEye = new Circle({
      left: centerX - 25,
      top: centerY - 15,
      radius: 5,
      fill: '#000000',
      selectable: true
    });

    const rightEye = new Circle({
      left: centerX + 15,
      top: centerY - 15,
      radius: 5,
      fill: '#000000',
      selectable: true
    });

    // Create smile
    const smile = new Path(
      'M -20 10 Q 0 25 20 10',
      {
        left: centerX - 20,
        top: centerY + 15,
        fill: '',
        stroke: '#000000',
        strokeWidth: 2,
        selectable: true
      }
    );

    // Add all elements to canvas
    fabricCanvasRef.current.add(face);
    fabricCanvasRef.current.add(leftEye);
    fabricCanvasRef.current.add(rightEye);
    fabricCanvasRef.current.add(smile);

    // Select the face (optional)
    // Select all the parts
    const objects = [face, leftEye, rightEye, smile];
    const selection = new ActiveSelection(objects, {
      canvas: fabricCanvasRef.current
    });

    fabricCanvasRef.current.setActiveObject(selection);
    fabricCanvasRef.current.requestRenderAll();
  };

  const addCustomPolygon = (sides = 6, starPoints = false) => {
    if (!fabricCanvasRef.current) return;
    const radius = 50;
    let path = '';

    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides;
      const r = starPoints && i % 2 === 0 ? radius * 0.5 : radius;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      path += `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }
    path += ' Z';

    const polygon = new Path(path, {
      left: 100,
      top: 100,
      fill: '#9c27b0',
      stroke: '#000000',
      strokeWidth: 1,
      selectable: true
    });

    fabricCanvasRef.current.add(polygon);
    fabricCanvasRef.current.setActiveObject(polygon);
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

  const downloadThumbnail = () => {
    if (!fabricCanvasRef.current) return;

    // Get the canvas data as a data URL
    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'jpeg',
      quality: 0.8 // Adjust quality to reduce size
    });

    // Create an image element
    const img = new Image();
    img.src = dataURL;

    img.onload = () => {
      // Create a canvas to resize the image
      const thumbnailCanvas = document.createElement('canvas');
      const ctx = thumbnailCanvas.getContext('2d');

      // Set the desired thumbnail size
      const maxWidth = 300; // Adjust as needed
      const maxHeight = 300; // Adjust as needed

      // Calculate the new dimensions
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      thumbnailCanvas.width = width;
      thumbnailCanvas.height = height;

      // Draw the resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert the thumbnail to a data URL
      const thumbnailDataURL = thumbnailCanvas.toDataURL('image/jpeg', 0.8);

      // Create a link to download the thumbnail
      const link = document.createElement('a');
      link.href = thumbnailDataURL;
      link.download = 'thumbnail.jpg';
      link.click();
    };
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

    // Explicitly clear local storage
    localStorage.removeItem('canvasState');
    console.log('Canvas cleared and local storage updated.');
  };


  const updateTextStyle = (style, value) => {
    if (!fabricCanvasRef.current) return;

    const activeObj = fabricCanvasRef.current.getActiveObject();
    if (!activeObj || !(activeObj.type === 'textbox' || activeObj.type === 'text' || activeObj.type === 'i-text')) return;

    // Save current editing state
    const wasEditing = activeObj.isEditing;
    const selectionStart = activeObj.selectionStart;
    const selectionEnd = activeObj.selectionEnd;

    try {
      // Apply the style change
      switch (style) {
        case 'size':
          activeObj.set('fontSize', parseInt(value, 10));
          break;
        case 'lineHeight':
          activeObj.set('lineHeight', parseFloat(value));
          break;
        case 'charSpacing':
          activeObj.set('charSpacing', parseInt(value, 10));
          break;
        case 'font':
          activeObj.set('fontFamily', value);
          break;
        case 'bold':
          activeObj.set('fontWeight', value ? 'bold' : 'normal');
          setFontStyle(prev => ({ ...prev, bold: value }));
          break;
        case 'italic':
          activeObj.set('fontStyle', value ? 'italic' : 'normal');
          setFontStyle(prev => ({ ...prev, italic: value }));
          break;
        case 'underline':
          activeObj.set('underline', value);
          setFontStyle(prev => ({ ...prev, underline: value }));
          break;
        case 'align':
          activeObj.set('textAlign', value);
          setTextAlign(value);
          break;
        case 'color':
          activeObj.set('fill', value);
          break;
        case 'backgroundColor':
          activeObj.set('backgroundColor', value);
          break;
        default:
          break;
      }

      // Ensure the object remains selected and active
      activeObj.setCoords();

      // If the object was being edited, maintain the editing state
      if (wasEditing) {
        activeObj.enterEditing();
        if (selectionStart !== undefined && selectionEnd !== undefined) {
          activeObj.selectionStart = selectionStart;
          activeObj.selectionEnd = selectionEnd;
        }
      }

      // Force a re-render of the canvas
      fabricCanvasRef.current.requestRenderAll();

      // Update the React state with the modified object
      setActiveObject(prevState => ({
        ...prevState,
        ...activeObj.toObject(),
        type: activeObj.type,
        fontSize: activeObj.fontSize,
        lineHeight: activeObj.lineHeight,
        charSpacing: activeObj.charSpacing,
        fontFamily: activeObj.fontFamily,
        fontWeight: activeObj.fontWeight,
        fontStyle: activeObj.fontStyle,
        underline: activeObj.underline,
        textAlign: activeObj.textAlign,
        fill: activeObj.fill,
        backgroundColor: activeObj.backgroundColor
      }));

    } catch (error) {
      console.error('Error updating text style:', error);
      // Optionally, revert changes if there's an error
      fabricCanvasRef.current.requestRenderAll();
    }
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

    <div className="page-wrapper">
      <div className="ad-top">Ad Top</div>

      <div className="content-wrapper">
        <div className="ad-left">Ad Left</div>

        <div className={`app-container ${isLandscape ? 'landscape' : 'portrait'}`}>
          <div className={`toolbar ${isLandscape ? 'landscape' : 'portrait'}`}>
            <h3>Tools</h3>


            <div className="tool-section">
              <div className="submenu shapes">
                <button onClick={addText} className="tool-button">
                  <i className="fa-solid fa-font"></i>
                </button>
                <button onClick={addRectangle} className="tool-button">
                  <i className="fa-solid fa-square"></i>
                </button>
                <button onClick={addCircle} className="tool-button">
                  <i className="fa-solid fa-circle"></i>
                </button>
                <button onClick={addEllipse} className="tool-button">
                  <i className="fa-solid fa-circle-dot"></i>
                </button>
                <button onClick={addTriangle} className="tool-button">
                  <i className="fa-solid fa-play"></i>
                </button>

                <button onClick={() => addPolygon(5)} className="tool-button" title="Pentagon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-pentagon">
                    <polygon points="12 2 22 8.5 18 20 6 20 2 8.5 12 2"></polygon>
                  </svg>
                </button>
                <button onClick={() => addPolygon(6)} className="tool-button" title="Hexagon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-hexagon">
                    <polygon points="19 4 5 4 1 12 5 20 19 20 23 12"></polygon>
                  </svg>
                </button>
                <button onClick={() => addPolygon(8)} className="tool-button" title="Octagon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-octagon">
                    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                  </svg>
                </button>

                <button onClick={() => addStar(5)} className="tool-button">
                  <i className="fa-solid fa-star"></i>
                </button>
                <button onClick={addDiamond} className="tool-button">
                  <i className="fa-solid fa-diamond"></i>
                </button>
                <button onClick={addHeart} className="tool-button">
                  <i className="fa-solid fa-heart"></i>
                </button>
                <button onClick={addLine} className="tool-button">
                  <i className="fa-solid fa-minus"></i>
                </button>
                <button onClick={addArrow} className="tool-button">
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
                <button onClick={addCross} className="tool-button">
                  <i className="fa-solid fa-plus"></i>
                </button>
                <button onClick={addSpeechBubble} className="tool-button">
                  <i className="fa-solid fa-comment"></i>
                </button>
                <button onClick={addDonut} className="tool-button">
                  <i className="fa-solid fa-circle-dot"></i>
                </button>
                <button onClick={addCloud} className="tool-button">
                  <i className="fa-solid fa-cloud"></i>
                </button>
                <button onClick={addStarburst} className="tool-button">
                  <i className="fa-solid fa-sun"></i>
                </button>
                <button onClick={addGear} className="tool-button">
                  <i className="fa-solid fa-gear"></i>
                </button>
                <button onClick={addSmiley} className="tool-button">
                  <i className="fa-solid fa-face-smile"></i>
                </button>
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
                      value={activeObject?.fontSize || 20}
                      onChange={(e) => updateTextStyle('size', e.target.value)}
                      onKeyUp={(e) => updateTextStyle('size', e.target.value)}
                      min="8"
                      max="200"
                    />

                    <label>Line Height</label>
                    <input
                      type="number"
                      value={activeObject?.lineHeight || 1}
                      onChange={(e) => updateTextStyle('lineHeight', e.target.value)}
                      onKeyUp={(e) => updateTextStyle('lineHeight', e.target.value)}
                      min="0.1"
                      max="10"
                      step="0.1"
                    />

                    <label>Letter Spacing</label>
                    <input
                      type="number"
                      value={activeObject?.charSpacing || 0}
                      onChange={(e) => updateTextStyle('charSpacing', e.target.value)}
                      onKeyUp={(e) => updateTextStyle('charSpacing', e.target.value)}
                      min="-100"
                      max="1000"
                    />



                    <div className="text-controls">
                      <button
                        className={fontStyle.bold ? 'active' : ''}
                        onClick={() => updateTextStyle('bold', !fontStyle.bold)}
                        title="Bold"
                      >
                        <i className="fas fa-bold"></i>
                      </button>
                      <button
                        className={fontStyle.italic ? 'active' : ''}
                        onClick={() => updateTextStyle('italic', !fontStyle.italic)}
                        title="Italic"
                      >
                        <i className="fas fa-italic"></i>
                      </button>
                      <button
                        className={fontStyle.underline ? 'active' : ''}
                        onClick={() => updateTextStyle('underline', !fontStyle.underline)}
                        title="Underline"
                      >
                        <i className="fas fa-underline"></i>
                      </button>
                    </div>

                    <div className="text-align">
                      <button
                        className={textAlign === 'left' ? 'active' : ''}
                        onClick={() => updateTextStyle('align', 'left')}
                        title="Align Left"
                      >
                        <i className="fas fa-align-left"></i>
                      </button>
                      <button
                        className={textAlign === 'center' ? 'active' : ''}
                        onClick={() => updateTextStyle('align', 'center')}
                        title="Align Center"
                      >
                        <i className="fas fa-align-center"></i>
                      </button>
                      <button
                        className={textAlign === 'right' ? 'active' : ''}
                        onClick={() => updateTextStyle('align', 'right')}
                        title="Align Right"
                      >
                        <i className="fas fa-align-right"></i>
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
                <div className="shape-controls">
  {/* Colors Section */}
  <div className="colors-formatting tool-section">
    <div className="color-pickers">
      <div className="color-picker">
        <label>Fill</label>
        <input
          type="color"
          value={activeObject.fill}
          onChange={(e) => updateShapeStyle('fill', e.target.value)}
        />
      </div>
      <div className="color-picker">
        <label>Stroke</label>
        <input
          type="color"
          value={activeObject.stroke}
          onChange={(e) => updateShapeStyle('stroke', e.target.value)}
        />
      </div>
    </div>
  </div>

  {/* Shape Properties Section */}
  <div className="properties-formatting tool-section">
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
  onChange={(e) => updateShapeStyle('opacity', parseFloat(e.target.value))}
  min="0"
  max="1"
  step="0.01"
/>
  </div>
</div>
              )}

            <div className="tool-section">
              <label>Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={addImage}
              />

              <label>Canvas Scale</label>
              <select
                className="scale-select"
                value={canvasScale}
                onChange={(e) => handleScaleChange(Number(e.target.value))}
              >
                <option value={0.25}>25%</option>
                <option value={0.5}>50%</option>
                <option value={0.75}>75%</option>
                <option value={1}>100%</option>
              </select>
            </div>
            <div className="tool-section">
              <div className="submenu other">

                <button
                  onClick={switchToLandscape}
                  title="Landscape (1280×720)"
                  className={`tool-button ${isLandscape ? 'active' : 'inactive'}`}
                  disabled={isLandscape}
                >
                  <i className="fa-solid fa-desktop"></i>
                </button>

                <button
                  onClick={switchToPortrait}
                  title="Portrait (720×1280)"
                  className={`tool-button ${!isLandscape ? 'active' : 'inactive'}`}
                  disabled={!isLandscape}
                >
                  <i className="fa-solid fa-mobile"></i>
                </button>

                <button onClick={deleteSelected} disabled={!activeObject} title="Delete Selected" className="tool-button">
                  <i className="fa-solid fa-trash"></i>
                </button>
                <button onClick={clearCanvas} title="Clear Canvas" className="tool-button">
                  <i className="fa-solid fa-eraser"></i>
                </button>
                <button onClick={downloadCanvas} title="Download as PNG" className="tool-button">
                  <i className="fa-solid fa-download"></i>
                </button>
                <button onClick={downloadThumbnail} title="Download Thumbnail" className="tool-button">
                  <i className="fa-solid fa-image"></i>
                </button>
              </div>
            </div>
          </div>
          <div className="canvas-container">
            <canvas ref={canvasRef} id="canvas" />
          </div>
        </div>

        <div className="ad-right">Ad Right</div>
      </div>

      <div className="ad-bottom">Ad Bottom</div>
    </div>

  );
}

export default App;