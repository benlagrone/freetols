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
// import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import ReactGA from 'react-ga4';
import Logo from './Logo'; // Ensure this matches the file name exactly
import Menu from './Menu'; // Import the Menu component
import TopContent from './TopContent.js'; // Ensure the path is correct
import BottomContent from './BottomContent.js'; // Ensure the path is correct
// import Tips from './Tips'; // Already shown in your example
// import Wisdoms from './Wisdoms'; // Adjust the path if necessary
// import Contact from './Contact'; // Adjust the path if necessary
// import Legal from './Legal'; // Adjust the path if necessary

// Initialize with your GA4 measurement ID
ReactGA.initialize('G-LJBMXKDXY9');

// Track a page view
ReactGA.send({ hitType: "pageview", page: window.location.pathname + window.location.search });

// Common fonts list
const FONTS = [
  'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Helvetica', 'Comic Sans MS', 'Impact', 'Tahoma', 'Trebuchet MS'
];
const STORAGE_KEY = 'thumbnailWizard.canvas.v2';
const LEGACY_STORAGE_KEY = 'canvasState';
const HISTORY_LIMIT = 80;
const DEFAULT_FONT_STYLE = { bold: false, italic: false, underline: false };
const SAFE_ZONE_PRESETS = {
  none: null,
  youtube: { label: 'YouTube 16:9', insetX: 0.05, insetY: 0.1 },
  shorts: { label: 'Shorts 9:16', insetX: 0.08, insetY: 0.12 }
};

function App() {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const historyLockRef = useRef(false);
  const historyStackRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const nextHistoryIdRef = useRef(1);
  const nextObjectIdRef = useRef(1);
  const snapEnabledRef = useRef(true);
  const snapThresholdRef = useRef(8);
  const snapToGridRef = useRef(true);
  const gridSizeRef = useRef(40);
  const showGuidesRef = useRef(true);
  const [activeObject, setActiveObject] = useState(null);
  const [textAlign, setTextAlign] = useState('left');
  const [isLandscape, setIsLandscape] = useState(false);
  const [fontStyle, setFontStyle] = useState(DEFAULT_FONT_STYLE);
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 720, height: 1280 });
  const [layers, setLayers] = useState([]);
  const [historyStack, setHistoryStack] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [snapshotName, setSnapshotName] = useState('');
  const [showRulers, setShowRulers] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [safeZonePreset, setSafeZonePreset] = useState('none');
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(40);
  const [snapThreshold, setSnapThreshold] = useState(8);

  useEffect(() => {
    snapEnabledRef.current = snapEnabled;
  }, [snapEnabled]);

  useEffect(() => {
    snapThresholdRef.current = snapThreshold;
  }, [snapThreshold]);

  useEffect(() => {
    snapToGridRef.current = snapToGrid;
  }, [snapToGrid]);

  useEffect(() => {
    gridSizeRef.current = gridSize;
  }, [gridSize]);

  useEffect(() => {
    showGuidesRef.current = showGuides;
  }, [showGuides]);

  const updateHistoryState = (nextStack, nextIndex) => {
    historyStackRef.current = nextStack;
    historyIndexRef.current = nextIndex;
    setHistoryStack(nextStack);
    setHistoryIndex(nextIndex);
  };

  const ensureObjectId = (obj) => {
    if (!obj) return null;
    if (!obj.objectId) {
      obj.set('objectId', `obj-${nextObjectIdRef.current++}`);
    }
    return obj.objectId;
  };

  const getLayerLabel = (obj, index) => {
    if (!obj) return `Layer ${index + 1}`;
    if (obj.isGuide) {
      return obj.guideOrientation === 'vertical' ? 'Guide (Vertical)' : 'Guide (Horizontal)';
    }
    if (obj.type === 'textbox' || obj.type === 'text' || obj.type === 'i-text') {
      const rawText = typeof obj.text === 'string' ? obj.text.trim() : '';
      if (rawText) {
        return `Text: ${rawText.slice(0, 22)}${rawText.length > 22 ? '...' : ''}`;
      }
      return 'Text';
    }
    const type = obj.type || 'object';
    return `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
  };

  const refreshLayers = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      setLayers([]);
      return;
    }

    const objects = canvas.getObjects();
    objects.forEach(ensureObjectId);
    const mappedLayers = objects.map((obj, index) => ({
      id: obj.objectId,
      index,
      label: getLayerLabel(obj, index),
      visible: obj.visible !== false,
      locked: obj.selectable === false || obj.lockMovementX === true
    })).reverse();
    setLayers(mappedLayers);
  };

  const serializeCanvasState = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return null;
    return JSON.stringify(canvas.toJSON(['objectId', 'isGuide', 'guideOrientation']));
  };

  const saveCanvasState = () => {
    const serialized = serializeCanvasState();
    if (!serialized) return;
    localStorage.setItem(STORAGE_KEY, serialized);
  };

  const normalizeGuideObject = (obj) => {
    if (!obj?.isGuide) return;
    const isVertical = obj.guideOrientation === 'vertical';
    const guideCanvas = obj.canvas;
    const guideCanvasWidth = guideCanvas?.getWidth?.() || canvasDimensions.width;
    const guideCanvasHeight = guideCanvas?.getHeight?.() || canvasDimensions.height;

    obj.set({
      x1: 0,
      y1: 0,
      x2: isVertical ? 0 : guideCanvasWidth,
      y2: isVertical ? guideCanvasHeight : 0,
      left: isVertical ? (obj.left ?? guideCanvasWidth / 2) : 0,
      top: isVertical ? 0 : (obj.top ?? guideCanvasHeight / 2),
      stroke: '#00a3ff',
      strokeWidth: 1,
      strokeDashArray: [6, 6],
      selectable: true,
      evented: true,
      hasControls: false,
      hasBorders: false,
      objectCaching: false,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
      lockSkewingX: true,
      lockSkewingY: true,
      lockMovementX: !isVertical,
      lockMovementY: isVertical,
      hoverCursor: isVertical ? 'ew-resize' : 'ns-resize',
      moveCursor: isVertical ? 'ew-resize' : 'ns-resize',
      excludeFromExport: true,
      visible: showGuidesRef.current
    });
    obj.setCoords();
  };

  const applySnapOffset = (sourceValues, targetValues, threshold) => {
    let bestOffset = 0;
    let bestDistance = threshold + 1;

    sourceValues.forEach((source) => {
      targetValues.forEach((target) => {
        const distance = Math.abs(source - target);
        if (distance <= threshold && distance < bestDistance) {
          bestDistance = distance;
          bestOffset = target - source;
        }
      });
    });

    return bestDistance <= threshold ? bestOffset : 0;
  };

  const pushHistoryEntry = (label = 'Edit', force = false) => {
    if (historyLockRef.current) return;

    const serialized = serializeCanvasState();
    if (!serialized) return;

    const currentStack = historyStackRef.current;
    const currentIndex = historyIndexRef.current;
    const currentEntry = currentStack[currentIndex];
    if (!force && currentEntry?.state === serialized) return;

    const nextEntry = {
      id: `hist-${nextHistoryIdRef.current++}`,
      label,
      state: serialized,
      createdAt: new Date().toISOString()
    };
    const trimmed = currentStack.slice(0, currentIndex + 1);
    let nextStack = [...trimmed, nextEntry];
    if (nextStack.length > HISTORY_LIMIT) {
      nextStack = nextStack.slice(nextStack.length - HISTORY_LIMIT);
    }
    updateHistoryState(nextStack, nextStack.length - 1);
  };

  const runBatchedCanvasUpdate = (label, action) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    historyLockRef.current = true;
    try {
      action(canvas);
    } finally {
      historyLockRef.current = false;
    }

    canvas.requestRenderAll();
    refreshLayers();
    saveCanvasState();
    pushHistoryEntry(label);
  };

  const restoreHistoryAtIndex = async (targetIndex) => {
    const canvas = fabricCanvasRef.current;
    const entry = historyStackRef.current[targetIndex];
    if (!canvas || !entry) return;

    historyLockRef.current = true;
    try {
      await canvas.loadFromJSON(entry.state);
      canvas.getObjects().forEach((obj) => {
        ensureObjectId(obj);
        normalizeGuideObject(obj);
      });
      canvas.requestRenderAll();
      setActiveObject(null);
      setTextAlign('left');
      setFontStyle(DEFAULT_FONT_STYLE);
      refreshLayers();
      historyIndexRef.current = targetIndex;
      setHistoryIndex(targetIndex);
      saveCanvasState();
    } catch (error) {
      console.error('Failed to restore history entry:', error);
    } finally {
      historyLockRef.current = false;
    }
  };

  const undoHistory = () => {
    const nextIndex = historyIndexRef.current - 1;
    if (nextIndex < 0) return;
    void restoreHistoryAtIndex(nextIndex);
  };

  const redoHistory = () => {
    const nextIndex = historyIndexRef.current + 1;
    if (nextIndex >= historyStackRef.current.length) return;
    void restoreHistoryAtIndex(nextIndex);
  };

  const addSnapshot = () => {
    const name = snapshotName.trim() || `Snapshot ${historyStackRef.current.length + 1}`;
    pushHistoryEntry(name, true);
    setSnapshotName('');
  };

  const handleScaleChange = (newScale) => {
    if (newScale === canvasScale) return;
    saveCanvasState();
    setCanvasScale(newScale);
  };

  const switchToLandscape = () => {
    switchOrientation(true);
  };

  const switchToPortrait = () => {
    switchOrientation(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!canvasRef.current) return;

    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.renderOnAddRemove = false;
      fabricCanvasRef.current.dispose();
      fabricCanvasRef.current = null;
    }

    const baseWidth = isLandscape ? 1280 : 720;
    const baseHeight = isLandscape ? 720 : 1280;
    const width = baseWidth * canvasScale;
    const height = baseHeight * canvasScale;
    setCanvasDimensions({ width, height });

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
    let disposed = false;

    const hydrateCanvas = async () => {
      const latestHistoryState = historyStackRef.current[historyIndexRef.current]?.state;
      const storedState = latestHistoryState || localStorage.getItem(STORAGE_KEY);

      if (storedState) {
        historyLockRef.current = true;
        try {
          await newCanvas.loadFromJSON(storedState);
        } catch (error) {
          console.error('Failed to restore saved canvas state:', error);
        } finally {
          historyLockRef.current = false;
        }
      } else {
        const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacyRaw) {
          try {
            const legacyObjects = JSON.parse(legacyRaw);
            historyLockRef.current = true;
            const enlivenedObjects = await util.enlivenObjects(legacyObjects);
            enlivenedObjects.forEach((obj) => {
              newCanvas.add(obj);
            });
          } catch (error) {
            console.error('Failed to migrate legacy canvas state:', error);
          } finally {
            historyLockRef.current = false;
          }
        }
      }

      if (disposed) return;

      newCanvas.getObjects().forEach((obj) => {
        ensureObjectId(obj);
        normalizeGuideObject(obj);
      });
      newCanvas.requestRenderAll();
      refreshLayers();

      if (historyStackRef.current.length === 0) {
        const initialState = serializeCanvasState();
        if (initialState) {
          const initialEntry = {
            id: `hist-${nextHistoryIdRef.current++}`,
            label: 'Initial',
            state: initialState,
            createdAt: new Date().toISOString()
          };
          updateHistoryState([initialEntry], 0);
        }
      }

      saveCanvasState();
    };

    void hydrateCanvas();

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

    const handleSelectionCleared = () => {
      setActiveObject(null);
      setTextAlign('left');
      setFontStyle(DEFAULT_FONT_STYLE);
    };

    const handleCanvasMutation = (label) => {
      if (historyLockRef.current) return;
      newCanvas.getObjects().forEach((obj) => {
        ensureObjectId(obj);
        normalizeGuideObject(obj);
      });
      refreshLayers();
      saveCanvasState();
      pushHistoryEntry(label);
    };

    const handleObjectMoving = (e) => {
      if (!snapEnabledRef.current) return;
      const movingObject = e?.target;
      if (!movingObject || movingObject.isGuide) return;

      const rect = movingObject.getBoundingRect();
      const xCandidates = [rect.left, rect.left + (rect.width / 2), rect.left + rect.width];
      const yCandidates = [rect.top, rect.top + (rect.height / 2), rect.top + rect.height];

      const xTargets = [0, newCanvas.getWidth() / 2, newCanvas.getWidth()];
      const yTargets = [0, newCanvas.getHeight() / 2, newCanvas.getHeight()];

      if (snapToGridRef.current) {
        const step = Math.max(8, Number(gridSizeRef.current) || 40);
        for (let x = 0; x <= newCanvas.getWidth(); x += step) {
          xTargets.push(x);
        }
        for (let y = 0; y <= newCanvas.getHeight(); y += step) {
          yTargets.push(y);
        }
      }

      newCanvas.getObjects().forEach((obj) => {
        if (obj === movingObject || obj.visible === false) return;
        if (obj.isGuide) {
          if (!showGuidesRef.current) return;
          if (obj.guideOrientation === 'vertical') {
            xTargets.push(obj.left || 0);
          } else if (obj.guideOrientation === 'horizontal') {
            yTargets.push(obj.top || 0);
          }
          return;
        }

        const otherRect = obj.getBoundingRect();
        xTargets.push(otherRect.left, otherRect.left + (otherRect.width / 2), otherRect.left + otherRect.width);
        yTargets.push(otherRect.top, otherRect.top + (otherRect.height / 2), otherRect.top + otherRect.height);
      });

      const threshold = Math.max(1, Number(snapThresholdRef.current) || 8);
      const snapDx = applySnapOffset(xCandidates, xTargets, threshold);
      const snapDy = applySnapOffset(yCandidates, yTargets, threshold);

      if (snapDx !== 0 || snapDy !== 0) {
        movingObject.set({
          left: (movingObject.left || 0) + snapDx,
          top: (movingObject.top || 0) + snapDy
        });
        movingObject.setCoords();
      }
    };

    newCanvas.on('selection:created', handleSelection);
    newCanvas.on('selection:updated', handleSelection);
    newCanvas.on('selection:cleared', handleSelectionCleared);
    newCanvas.on('object:moving', handleObjectMoving);
    newCanvas.on('object:added', () => handleCanvasMutation('Added object'));
    newCanvas.on('object:modified', () => handleCanvasMutation('Modified object'));
    newCanvas.on('object:removed', () => handleCanvasMutation('Removed object'));

    return () => {
      disposed = true;
      newCanvas.off();
      newCanvas.dispose();
      if (fabricCanvasRef.current === newCanvas) {
        fabricCanvasRef.current = null;
      }
    };
  }, [isLandscape, canvasScale]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.getObjects().forEach((obj) => {
      if (!obj.isGuide) return;
      obj.set('visible', showGuides);
    });
    canvas.requestRenderAll();
    refreshLayers();
  }, [showGuides]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchOrientation = (newIsLandscape) => {
    if (newIsLandscape === isLandscape) return;
    if (!fabricCanvasRef.current) {
      setIsLandscape(newIsLandscape);
      return;
    }

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

      canvas.requestRenderAll();
      saveCanvasState();
      pushHistoryEntry('Switched orientation');
      setIsLandscape(newIsLandscape);
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
      `M 10,30
       A 20,20 0 0,1 50,30
       A 20,20 0 0,1 90,30
       Q 90,60 50,90
       Q 10,60 10,30 z`,
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
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const selected = canvas.getActiveObjects();
    if (selected.length === 0) return;

    runBatchedCanvasUpdate('Deleted selection', (batchedCanvas) => {
      selected.forEach((obj) => {
        batchedCanvas.remove(obj);
      });
      batchedCanvas.discardActiveObject();
      setActiveObject(null);
      setTextAlign('left');
      setFontStyle(DEFAULT_FONT_STYLE);
    });
  };

  const getLayerObject = (objectId) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return null;
    return canvas.getObjects().find((obj) => obj.objectId === objectId) || null;
  };

  const selectLayer = (objectId) => {
    const canvas = fabricCanvasRef.current;
    const target = getLayerObject(objectId);
    if (!canvas || !target) return;
    canvas.setActiveObject(target);
    canvas.requestRenderAll();
    setActiveObject(target);
  };

  const toggleLayerVisibility = (objectId) => {
    const target = getLayerObject(objectId);
    if (!target) return;
    runBatchedCanvasUpdate('Toggled layer visibility', () => {
      const nextVisibility = !(target.visible !== false);
      target.set('visible', nextVisibility);
      if (!nextVisibility && fabricCanvasRef.current?.getActiveObject() === target) {
        fabricCanvasRef.current.discardActiveObject();
        setActiveObject(null);
      }
    });
  };

  const toggleLayerLock = (objectId) => {
    const target = getLayerObject(objectId);
    if (!target) return;
    runBatchedCanvasUpdate('Toggled layer lock', () => {
      const nextLocked = !(target.selectable === false || target.lockMovementX === true);
      target.set({
        selectable: !nextLocked,
        evented: !nextLocked,
        lockMovementX: nextLocked,
        lockMovementY: nextLocked,
        lockScalingX: nextLocked,
        lockScalingY: nextLocked,
        lockRotation: nextLocked
      });
      if (nextLocked && fabricCanvasRef.current?.getActiveObject() === target) {
        fabricCanvasRef.current.discardActiveObject();
        setActiveObject(null);
      }
    });
  };

  const moveLayer = (objectId, direction) => {
    const canvas = fabricCanvasRef.current;
    const target = getLayerObject(objectId);
    if (!canvas || !target) return;

    const objects = canvas.getObjects();
    const currentIndex = objects.indexOf(target);
    if (currentIndex === -1) return;
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= objects.length) return;

    canvas.moveObjectTo(target, nextIndex);
    canvas.setActiveObject(target);
    canvas.requestRenderAll();
    setActiveObject(target);
    refreshLayers();
    saveCanvasState();
    pushHistoryEntry('Reordered layers');
  };

  const deleteLayer = (objectId) => {
    const target = getLayerObject(objectId);
    if (!target) return;
    runBatchedCanvasUpdate('Deleted layer', (canvas) => {
      canvas.remove(target);
      if (canvas.getActiveObject() === target) {
        canvas.discardActiveObject();
        setActiveObject(null);
      }
    });
  };

  const addGuide = (orientation = 'vertical') => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const isVertical = orientation === 'vertical';
    const guide = isVertical
      ? new Line([0, 0, 0, canvas.getHeight()], {
        left: canvas.getWidth() / 2,
        top: 0
      })
      : new Line([0, 0, canvas.getWidth(), 0], {
        left: 0,
        top: canvas.getHeight() / 2
      });

    guide.set({
      isGuide: true,
      guideOrientation: orientation
    });
    ensureObjectId(guide);
    normalizeGuideObject(guide);

    runBatchedCanvasUpdate('Added guide', (batchedCanvas) => {
      batchedCanvas.add(guide);
      batchedCanvas.setActiveObject(guide);
      setActiveObject(guide);
    });
  };

  const addVerticalGuide = () => addGuide('vertical');
  const addHorizontalGuide = () => addGuide('horizontal');

  const clearGuides = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    runBatchedCanvasUpdate('Cleared guides', (batchedCanvas) => {
      const guides = batchedCanvas.getObjects().filter((obj) => obj.isGuide);
      guides.forEach((guide) => batchedCanvas.remove(guide));
      if (batchedCanvas.getActiveObject()?.isGuide) {
        batchedCanvas.discardActiveObject();
        setActiveObject(null);
      }
    });
  };

  const groupSelection = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!(active instanceof ActiveSelection)) return;

    runBatchedCanvasUpdate('Grouped selection', (batchedCanvas) => {
      const groupedObjects = active.removeAll();
      batchedCanvas.discardActiveObject();
      groupedObjects.forEach((obj) => batchedCanvas.remove(obj));
      const grouped = new Group(groupedObjects, {
        objectCaching: false,
        selectable: true
      });
      ensureObjectId(grouped);
      batchedCanvas.add(grouped);
      batchedCanvas.setActiveObject(grouped);
      setActiveObject(grouped);
    });
  };

  const ungroupSelection = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!(active instanceof Group) || active instanceof ActiveSelection) return;

    runBatchedCanvasUpdate('Ungrouped selection', (batchedCanvas) => {
      const ungroupedObjects = active.removeAll();
      batchedCanvas.remove(active);
      ungroupedObjects.forEach((obj) => {
        batchedCanvas.add(obj);
      });
      if (ungroupedObjects.length > 1) {
        const selection = new ActiveSelection(ungroupedObjects, { canvas: batchedCanvas });
        batchedCanvas.setActiveObject(selection);
        setActiveObject(selection);
      } else if (ungroupedObjects.length === 1) {
        batchedCanvas.setActiveObject(ungroupedObjects[0]);
        setActiveObject(ungroupedObjects[0]);
      } else {
        setActiveObject(null);
      }
    });
  };

  const withGuidesHidden = (operation) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return null;
    const guides = canvas.getObjects().filter((obj) => obj.isGuide);
    const previousVisibility = guides.map((guide) => ({
      guide,
      visible: guide.visible !== false
    }));

    guides.forEach((guide) => guide.set('visible', false));
    canvas.requestRenderAll();
    try {
      return operation();
    } finally {
      previousVisibility.forEach(({ guide, visible }) => {
        guide.set('visible', visible && showGuidesRef.current);
      });
      canvas.requestRenderAll();
    }
  };

  const downloadThumbnail = () => {
    if (!fabricCanvasRef.current) return;

    // Get the canvas data as a data URL
    const dataURL = withGuidesHidden(() => fabricCanvasRef.current.toDataURL({
      format: 'jpeg',
      quality: 0.8 // Adjust quality to reduce size
    }));
    if (!dataURL) return;

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
    const dataURL = withGuidesHidden(() => fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1
    }));
    if (!dataURL) return;
    const link = document.createElement('a');
    link.download = 'canvas-design.png';
    link.href = dataURL;
    link.click();
  };

  const clearCanvas = () => {
    if (!fabricCanvasRef.current) return;

    runBatchedCanvasUpdate('Cleared canvas', (canvas) => {
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      setActiveObject(null);
      setTextAlign('left');
      setFontStyle(DEFAULT_FONT_STYLE);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    });
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
        backgroundColor: activeObj.backgroundColor,
        objectId: activeObj.objectId
      }));
      saveCanvasState();
      refreshLayers();
      pushHistoryEntry('Updated text');

    } catch (error) {
      console.error('Error updating text style:', error);
      // Optionally, revert changes if there's an error
      fabricCanvasRef.current.requestRenderAll();
    }
  };

  const updateShapeStyle = (style, value) => {
    if (!fabricCanvasRef.current) return;
    const selectedObject = fabricCanvasRef.current.getActiveObject();
    if (!selectedObject) return;

    switch (style) {
      case 'fill':
        selectedObject.set('fill', value);
        break;
      case 'stroke':
        selectedObject.set('stroke', value);
        break;
      case 'strokeWidth':
        selectedObject.set('strokeWidth', parseInt(value, 10));
        break;
      case 'opacity':
        selectedObject.set('opacity', parseFloat(value));
        break;
      default:
        break;
    }
    fabricCanvasRef.current.requestRenderAll();
    saveCanvasState();
    refreshLayers();
    pushHistoryEntry('Updated shape');
  };

  useEffect(() => {
    const isTypingTarget = (target) => {
      if (!target) return false;
      const tagName = target.tagName?.toLowerCase();
      return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable;
    };

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const isMeta = event.metaKey || event.ctrlKey;
      const typing = isTypingTarget(event.target);

      if (isMeta && key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undoHistory();
        return;
      }
      if (isMeta && (key === 'y' || (key === 'z' && event.shiftKey))) {
        event.preventDefault();
        redoHistory();
        return;
      }
      if (typing) return;

      if (key === 'delete' || key === 'backspace') {
        event.preventDefault();
        deleteSelected();
        return;
      }
      if (isMeta && key === 'g' && !event.shiftKey) {
        event.preventDefault();
        groupSelection();
        return;
      }
      if (isMeta && key === 'g' && event.shiftKey) {
        event.preventDefault();
        ungroupSelection();
        return;
      }
      if (isMeta && key === 's') {
        event.preventDefault();
        downloadCanvas();
        return;
      }

      switch (key) {
        case 'g':
          setShowGrid((previous) => !previous);
          break;
        case 's':
          setSnapEnabled((previous) => !previous);
          break;
        case 't':
          addText();
          break;
        case 'r':
          addRectangle();
          break;
        case 'c':
          addCircle();
          break;
        case 'l':
          addLine();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const normalizeHexColor = (value, fallback = '#000000') => (
    typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback
  );
  const selectedLayerId = activeObject?.objectId || null;
  const activeCanvasObject = fabricCanvasRef.current?.getActiveObject() || null;
  const canGroupSelection = !!activeCanvasObject && activeCanvasObject instanceof ActiveSelection;
  const canUngroupSelection = !!activeCanvasObject && activeCanvasObject instanceof Group && !(activeCanvasObject instanceof ActiveSelection);
  const safeZoneConfig = SAFE_ZONE_PRESETS[safeZonePreset];
  const safeZoneStyle = safeZoneConfig ? {
    left: `${safeZoneConfig.insetX * 100}%`,
    right: `${safeZoneConfig.insetX * 100}%`,
    top: `${safeZoneConfig.insetY * 100}%`,
    bottom: `${safeZoneConfig.insetY * 100}%`
  } : null;
  const rulerMinorStep = 20;
  const rulerMajorStep = 100;
  const horizontalRulerTicks = [];
  const verticalRulerTicks = [];
  for (let value = 0; value <= canvasDimensions.width; value += rulerMinorStep) {
    horizontalRulerTicks.push({
      value,
      major: value % rulerMajorStep === 0
    });
  }
  for (let value = 0; value <= canvasDimensions.height; value += rulerMinorStep) {
    verticalRulerTicks.push({
      value,
      major: value % rulerMajorStep === 0
    });
  }
  const rulerGutter = showRulers ? 24 : 0;
  const clampedGridSize = Math.max(8, Number(gridSize) || 40);

  // The JSX return remains exactly the same as in your current code
  return (

    <div className="page-wrapper">
      <div className="ad-top"></div>
  {/* Logo and Menu Section */}

      {/* Logo and Menu Section */}
      <div className="header">
        <Logo />
        <Menu />
      </div>
        {/* New Content Section Above the App Container */}
        <TopContent /> {/* Use the TopContent component here */}

      <div className="content-wrapper">
        <div className="ad-left"></div>

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
                      value={normalizeHexColor(activeObject.fill, '#000000')}
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
                          value={normalizeHexColor(activeObject.fill, '#000000')}
                          onChange={(e) => updateShapeStyle('fill', e.target.value)}
                        />
                      </div>
                      <div className="color-picker">
                        <label>Stroke</label>
                        <input
                          type="color"
                          value={normalizeHexColor(activeObject.stroke, '#000000')}
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
              <label>History</label>
              <div className="history-actions">
                <button
                  onClick={undoHistory}
                  disabled={historyIndex <= 0}
                  title="Undo (Cmd/Ctrl+Z)"
                  className="tool-button compact"
                >
                  <i className="fa-solid fa-arrow-rotate-left"></i>
                </button>
                <button
                  onClick={redoHistory}
                  disabled={historyIndex >= historyStack.length - 1}
                  title="Redo (Cmd/Ctrl+Shift+Z)"
                  className="tool-button compact"
                >
                  <i className="fa-solid fa-arrow-rotate-right"></i>
                </button>
              </div>
              <div className="snapshot-row">
                <input
                  type="text"
                  value={snapshotName}
                  placeholder="Snapshot name"
                  onChange={(e) => setSnapshotName(e.target.value)}
                />
                <button onClick={addSnapshot} className="tool-button compact" title="Save Snapshot">
                  <i className="fa-solid fa-camera"></i>
                </button>
              </div>
              <div className="history-list">
                {historyStack.slice().reverse().map((entry, reverseIndex) => {
                  const stackIndex = historyStack.length - 1 - reverseIndex;
                  const timeText = new Date(entry.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });
                  return (
                    <button
                      key={entry.id}
                      onClick={() => restoreHistoryAtIndex(stackIndex)}
                      className={`history-item ${stackIndex === historyIndex ? 'active' : ''}`}
                    >
                      <span className="history-label">{entry.label}</span>
                      <span className="history-time">{timeText}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="tool-section">
              <label>Layers</label>
              <div className="layer-groups">
                <button
                  onClick={groupSelection}
                  className="tool-button compact"
                  disabled={!canGroupSelection}
                  title="Group (Cmd/Ctrl+G)"
                >
                  <i className="fa-solid fa-object-group"></i>
                </button>
                <button
                  onClick={ungroupSelection}
                  className="tool-button compact"
                  disabled={!canUngroupSelection}
                  title="Ungroup (Cmd/Ctrl+Shift+G)"
                >
                  <i className="fa-solid fa-object-ungroup"></i>
                </button>
              </div>
              <div className="layers-list">
                {layers.map((layer) => (
                  <div key={layer.id} className="layer-item">
                    <button
                      className={`layer-name ${selectedLayerId === layer.id ? 'active' : ''}`}
                      onClick={() => selectLayer(layer.id)}
                      title={layer.label}
                    >
                      {layer.label}
                    </button>
                    <div className="layer-actions">
                      <button
                        className="tool-button compact"
                        onClick={() => toggleLayerVisibility(layer.id)}
                        title={layer.visible ? 'Hide layer' : 'Show layer'}
                      >
                        <i className={`fa-solid ${layer.visible ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                      </button>
                      <button
                        className="tool-button compact"
                        onClick={() => toggleLayerLock(layer.id)}
                        title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                      >
                        <i className={`fa-solid ${layer.locked ? 'fa-lock' : 'fa-lock-open'}`}></i>
                      </button>
                      <button
                        className="tool-button compact"
                        onClick={() => moveLayer(layer.id, 1)}
                        title="Move up"
                      >
                        <i className="fa-solid fa-arrow-up"></i>
                      </button>
                      <button
                        className="tool-button compact"
                        onClick={() => moveLayer(layer.id, -1)}
                        title="Move down"
                      >
                        <i className="fa-solid fa-arrow-down"></i>
                      </button>
                      <button
                        className="tool-button compact"
                        onClick={() => deleteLayer(layer.id)}
                        title="Delete layer"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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

            <div className="tool-section guides-panel">
              <label>Guides &amp; Snap</label>
              <div className="guide-toggle-list">
                <label className="inline-toggle">
                  <input
                    type="checkbox"
                    checked={showRulers}
                    onChange={(e) => setShowRulers(e.target.checked)}
                  />
                  Show Rulers
                </label>
                <label className="inline-toggle">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                  />
                  Show Grid
                </label>
                <label className="inline-toggle">
                  <input
                    type="checkbox"
                    checked={showGuides}
                    onChange={(e) => setShowGuides(e.target.checked)}
                  />
                  Show Guides
                </label>
                <label className="inline-toggle">
                  <input
                    type="checkbox"
                    checked={snapEnabled}
                    onChange={(e) => setSnapEnabled(e.target.checked)}
                  />
                  Snap Enabled
                </label>
                <label className="inline-toggle">
                  <input
                    type="checkbox"
                    checked={snapToGrid}
                    onChange={(e) => setSnapToGrid(e.target.checked)}
                  />
                  Snap To Grid
                </label>
              </div>
              <div className="guide-input-grid">
                <div>
                  <label>Grid Size (px)</label>
                  <input
                    type="number"
                    min="8"
                    max="400"
                    step="1"
                    value={gridSize}
                    onChange={(e) => setGridSize(Math.max(8, Number(e.target.value) || 8))}
                  />
                </div>
                <div>
                  <label>Snap Threshold (px)</label>
                  <input
                    type="number"
                    min="1"
                    max="80"
                    step="1"
                    value={snapThreshold}
                    onChange={(e) => setSnapThreshold(Math.max(1, Number(e.target.value) || 1))}
                  />
                </div>
              </div>
              <label>Safe Zone</label>
              <select
                value={safeZonePreset}
                onChange={(e) => setSafeZonePreset(e.target.value)}
              >
                {Object.entries(SAFE_ZONE_PRESETS).map(([presetId, preset]) => (
                  <option key={presetId} value={presetId}>
                    {preset ? preset.label : 'Off'}
                  </option>
                ))}
              </select>
              <div className="guide-actions">
                <button onClick={addVerticalGuide} className="tool-button compact" title="Add vertical guide">
                  +V
                </button>
                <button onClick={addHorizontalGuide} className="tool-button compact" title="Add horizontal guide">
                  +H
                </button>
                <button onClick={clearGuides} className="tool-button compact" title="Clear guides">
                  Clear
                </button>
              </div>
              <div className="shortcut-hint">Shortcuts: G toggles grid, S toggles snap.</div>
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

                <button onClick={deleteSelected} disabled={!activeCanvasObject} title="Delete Selected" className="tool-button">
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
          <div className="canvas-container main-canvas">
            <div
              className={`canvas-stage ${showRulers ? 'with-rulers' : ''}`}
              style={{
                width: `${canvasDimensions.width + rulerGutter}px`,
                height: `${canvasDimensions.height + rulerGutter}px`
              }}
            >
              {showRulers && (
                <>
                  <div
                    className="ruler ruler-horizontal"
                    style={{
                      left: `${rulerGutter}px`,
                      width: `${canvasDimensions.width}px`
                    }}
                  >
                    {horizontalRulerTicks.map((tick) => (
                      <span
                        key={`x-${tick.value}`}
                        className={`ruler-tick ${tick.major ? 'major' : 'minor'}`}
                        style={{
                          left: `${(tick.value / Math.max(canvasDimensions.width, 1)) * 100}%`
                        }}
                      >
                        {tick.major && <span className="ruler-label">{tick.value}</span>}
                      </span>
                    ))}
                  </div>
                  <div
                    className="ruler ruler-vertical"
                    style={{
                      top: `${rulerGutter}px`,
                      height: `${canvasDimensions.height}px`
                    }}
                  >
                    {verticalRulerTicks.map((tick) => (
                      <span
                        key={`y-${tick.value}`}
                        className={`ruler-tick ${tick.major ? 'major' : 'minor'}`}
                        style={{
                          top: `${(tick.value / Math.max(canvasDimensions.height, 1)) * 100}%`
                        }}
                      >
                        {tick.major && <span className="ruler-label">{tick.value}</span>}
                      </span>
                    ))}
                  </div>
                  <div className="ruler-corner"></div>
                </>
              )}
              <div
                className="canvas-viewport"
                style={{
                  width: `${canvasDimensions.width}px`,
                  height: `${canvasDimensions.height}px`,
                  left: `${rulerGutter}px`,
                  top: `${rulerGutter}px`
                }}
              >
                {showGrid && (
                  <div
                    className="grid-overlay"
                    style={{ backgroundSize: `${clampedGridSize}px ${clampedGridSize}px` }}
                  ></div>
                )}
                {safeZoneConfig && (
                  <div className="safe-zone-overlay" style={safeZoneStyle}>
                    <span className="safe-zone-label">{safeZoneConfig.label}</span>
                  </div>
                )}
                <canvas ref={canvasRef} id="canvas" />
              </div>
            </div>
          </div>
        </div>


        <div className="ad-right"></div>
      </div>

      <BottomContent /> {/* Use the BottomContent component here */}

      <div className="ad-bottom"></div>
    </div>

  );
}

export default App;
