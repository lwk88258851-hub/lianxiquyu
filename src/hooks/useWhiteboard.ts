import { useState, useCallback, useRef } from 'react';
import { WhiteboardState, DrawingPath, ToolType, ShapeType, Point, TextElement, QuestionData, QuestionElement } from '../types';

export function useWhiteboard() {
  const [state, setState] = useState<WhiteboardState>({
    pages: [{ id: 'page-1', elements: [], redoStack: [] }],
    currentPageIndex: 0,
    currentPath: null,
    activeTool: 'pen',
    activeShape: 'rectangle',
    color: '#FFFFFF',
    width: 4,
    magnification: 2,
    isSmartShapeEnabled: true,
    columns: 1,
    columnOffsets: [],
    lastWritingTool: 'pen',
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  const currentPage = state.pages[state.currentPageIndex];

  const startDrawing = useCallback((x: number, y: number, pressure?: number) => {
    isDrawingRef.current = true;
    setState(prev => {
      // Determine which column the drawing started in
      let columnIndex = 0;
      for (let i = 0; i < prev.columnOffsets.length; i++) {
        if (x > prev.columnOffsets[i]) {
          columnIndex = i + 1;
        } else {
          break;
        }
      }

      const newPath: DrawingPath = {
        id: Math.random().toString(36).substr(2, 9),
        type: prev.activeTool,
        shapeType: prev.activeTool === 'shape' ? prev.activeShape : undefined,
        points: [{ x, y, pressure, timestamp: Date.now() }],
        color: prev.color,
        width: prev.width,
        opacity: prev.activeTool === 'highlighter' ? 0.5 : 1,
        isComplete: false,
        columnIndex,
      };
      
      const newPages = [...prev.pages];
      newPages[prev.currentPageIndex] = {
        ...newPages[prev.currentPageIndex],
        redoStack: []
      };

      return {
        ...prev,
        pages: newPages,
        currentPath: newPath
      };
    });
  }, []);

  const updateDrawing = useCallback((x: number, y: number, pressure?: number) => {
    if (!isDrawingRef.current) return;

    setState(prev => {
      if (!prev.currentPath) return prev;

      if (prev.currentPath.type === 'shape') {
        const startPoint = prev.currentPath.points[0];
        return {
          ...prev,
          currentPath: {
            ...prev.currentPath,
            points: [startPoint, { x, y, pressure, timestamp: Date.now() }]
          }
        };
      }

      return {
        ...prev,
        currentPath: {
          ...prev.currentPath,
          points: [...prev.currentPath.points, { x, y, pressure, timestamp: Date.now() }]
        }
      };
    });
  }, []);

  const endDrawing = useCallback(async () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    setState(prev => {
      if (!prev.currentPath) return prev;
      let completedPath = { ...prev.currentPath, isComplete: true };

      if (prev.isSmartShapeEnabled && completedPath.type === 'pen' && completedPath.points.length > 10) {
        const points = completedPath.points;
        const xCoords = points.map(p => p.x);
        const yCoords = points.map(p => p.y);
        const minX = Math.min(...xCoords);
        const maxX = Math.max(...xCoords);
        const minY = Math.min(...yCoords);
        const maxY = Math.max(...yCoords);
        const width = maxX - minX;
        const height = maxY - minY;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const radius = (width + height) / 4;
        const isCircle = points.every(p => {
          const dist = Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2);
          return Math.abs(dist - radius) < radius * 0.4;
        });

        if (isCircle) {
          const circlePoints: Point[] = [];
          for (let i = 0; i <= 32; i++) {
            const angle = (i / 32) * Math.PI * 2;
            circlePoints.push({
              x: centerX + Math.cos(angle) * radius,
              y: centerY + Math.sin(angle) * radius,
              timestamp: Date.now()
            });
          }
          completedPath.points = circlePoints;
        }
      }

    if (['spotlight', 'magnifier', 'select'].includes(completedPath.type)) {
      return { ...prev, currentPath: null };
    }

      const newPages = [...prev.pages];
      newPages[prev.currentPageIndex] = {
        ...newPages[prev.currentPageIndex],
        elements: [...newPages[prev.currentPageIndex].elements, completedPath]
      };

      return {
        ...prev,
        pages: newPages,
        currentPath: null
      };
    });
  }, []);

  const setShape = useCallback((shape: ShapeType) => {
    setState(prev => ({ ...prev, activeShape: shape, activeTool: 'shape' }));
  }, []);

  const toggleSmartShape = useCallback(() => {
    setState(prev => ({ ...prev, isSmartShapeEnabled: !prev.isSmartShapeEnabled }));
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      const currentPage = prev.pages[prev.currentPageIndex];
      if (currentPage.elements.length === 0) return prev;
      
      const lastElement = currentPage.elements[currentPage.elements.length - 1];
      const newPages = [...prev.pages];
      newPages[prev.currentPageIndex] = {
        ...currentPage,
        elements: currentPage.elements.slice(0, -1),
        redoStack: [lastElement, ...currentPage.redoStack]
      };

      return { ...prev, pages: newPages };
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      const currentPage = prev.pages[prev.currentPageIndex];
      if (currentPage.redoStack.length === 0) return prev;
      
      const nextElement = currentPage.redoStack[0];
      const newPages = [...prev.pages];
      newPages[prev.currentPageIndex] = {
        ...currentPage,
        elements: [...currentPage.elements, nextElement],
        redoStack: currentPage.redoStack.slice(1)
      };

      return { ...prev, pages: newPages };
    });
  }, []);

  const clearAll = useCallback(() => {
    setState(prev => {
      const newPages = [...prev.pages];
      newPages[prev.currentPageIndex] = {
        ...newPages[prev.currentPageIndex],
        elements: [],
        redoStack: []
      };
      return { ...prev, pages: newPages, currentPath: null };
    });
  }, []);

  const setTool = useCallback((tool: ToolType) => {
    setState(prev => ({ 
      ...prev, 
      activeTool: tool,
      lastWritingTool: tool !== 'select' ? tool : prev.lastWritingTool
    }));
  }, []);

  const toggleSelectMode = useCallback(() => {
    setState(prev => {
      const isCurrentlySelect = prev.activeTool === 'select';
      return {
        ...prev,
        activeTool: isCurrentlySelect ? prev.lastWritingTool : 'select',
        currentPath: null
      };
    });
  }, []);

  const setColor = useCallback((color: string) => {
    setState(prev => ({ ...prev, color }));
  }, []);

  const setWidth = useCallback((width: number) => {
    setState(prev => ({ ...prev, width }));
  }, []);

  const setMagnification = useCallback((magnification: number) => {
    setState(prev => ({ ...prev, magnification }));
  }, []);

  const addQuestion = useCallback((data: QuestionData) => {
    setState(prev => {
      const currentPage = prev.pages[prev.currentPageIndex];
      const questions = currentPage.elements.filter(el => el.type === 'question') as QuestionElement[];
      const qIndex = questions.length;
      
      let x, y, columnIndex;
      if (prev.columns > 1) {
        const columnWidth = window.innerWidth / prev.columns;
        const col = qIndex % prev.columns;
        const row = Math.floor(qIndex / prev.columns);
        x = col * columnWidth + (columnWidth - 400) / 2;
        y = 100 + row * 400;
        columnIndex = col;
      } else {
        const offset = qIndex * 30;
        x = window.innerWidth / 2 - 200 + offset;
        y = window.innerHeight / 2 - 150 + offset;
        columnIndex = 0;
      }

      const newQuestion: QuestionElement = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'question',
        x,
        y,
        width: 400,
        height: 300,
        data,
        isAnswerRevealed: false,
        columnIndex,
      };
      
      const newPages = [...prev.pages];
      newPages[prev.currentPageIndex] = {
        ...currentPage,
        elements: [...currentPage.elements, newQuestion],
        redoStack: []
      };

      return { ...prev, pages: newPages };
    });
  }, []);

  const selectQuestionOption = useCallback((elementId: string, optionId: string) => {
    setState(prev => {
      const newPages = [...prev.pages];
      newPages[prev.currentPageIndex] = {
        ...newPages[prev.currentPageIndex],
        elements: newPages[prev.currentPageIndex].elements.map(el => 
          el.id === elementId && el.type === 'question' 
            ? { ...el, selectedOptionId: optionId } 
            : el
        )
      };
      return { ...prev, pages: newPages };
    });
  }, []);

  const toggleQuestionAnswer = useCallback((elementId: string) => {
    setState(prev => {
      const newPages = [...prev.pages];
      newPages[prev.currentPageIndex] = {
        ...newPages[prev.currentPageIndex],
        elements: newPages[prev.currentPageIndex].elements.map(el => 
          el.id === elementId && el.type === 'question' 
            ? { ...el, isAnswerRevealed: !el.isAnswerRevealed } 
            : el
        )
      };
      return { ...prev, pages: newPages };
    });
  }, []);

  const deleteElement = useCallback((elementId: string) => {
    setState(prev => {
      const currentPage = prev.pages[prev.currentPageIndex];
      const elementToDelete = currentPage.elements.find(el => el.id === elementId);
      if (!elementToDelete) return prev;
      
      const newPages = [...prev.pages];
      newPages[prev.currentPageIndex] = {
        ...currentPage,
        elements: currentPage.elements.filter(el => el.id !== elementId),
        redoStack: [elementToDelete, ...currentPage.redoStack]
      };

      return { ...prev, pages: newPages };
    });
  }, []);

  const moveElement = useCallback((elementId: string, x: number, y: number) => {
    setState(prev => {
      // Determine which column the element is moved to
      let columnIndex = 0;
      for (let i = 0; i < prev.columnOffsets.length; i++) {
        if (x > prev.columnOffsets[i]) {
          columnIndex = i + 1;
        } else {
          break;
        }
      }

      const newPages = [...prev.pages];
      newPages[prev.currentPageIndex] = {
        ...newPages[prev.currentPageIndex],
        elements: newPages[prev.currentPageIndex].elements.map(el => 
          el.id === elementId ? { ...el, x, y, columnIndex } : el
        )
      };
      return { ...prev, pages: newPages };
    });
  }, []);

  const addPage = useCallback(() => {
    setState(prev => ({
      ...prev,
      pages: [...prev.pages, { id: `page-${prev.pages.length + 1}`, elements: [], redoStack: [] }],
      currentPageIndex: prev.pages.length
    }));
  }, []);

  const removePage = useCallback((index: number) => {
    setState(prev => {
      if (prev.pages.length <= 1) return prev;
      const newPages = prev.pages.filter((_, i) => i !== index);
      const newIndex = Math.min(prev.currentPageIndex, newPages.length - 1);
      return { ...prev, pages: newPages, currentPageIndex: newIndex };
    });
  }, []);

  const setPage = useCallback((index: number) => {
    setState(prev => ({ ...prev, currentPageIndex: index }));
  }, []);

  const setColumns = useCallback((columns: number) => {
    setState(prev => {
      const newPages = [...prev.pages];
      const currentPage = newPages[prev.currentPageIndex];
      
      // Initialize column offsets
      const columnOffsets: number[] = [];
      for (let i = 1; i < columns; i++) {
        columnOffsets.push((window.innerWidth / columns) * i);
      }

      // If columns changed, we might want to rearrange questions
      if (columns > 1) {
        const questions = currentPage.elements.filter(el => el.type === 'question') as QuestionElement[];
        const columnWidth = window.innerWidth / columns;
        
        const rearrangedElements = currentPage.elements.map(el => {
          if (el.type === 'question') {
            const qIndex = questions.indexOf(el as QuestionElement);
            const col = qIndex % columns;
            const row = Math.floor(qIndex / columns);
            return {
              ...el,
              x: col * columnWidth + (columnWidth - 400) / 2,
              y: 100 + row * 400,
              columnIndex: col
            };
          }
          return { ...el, columnIndex: el.columnIndex ?? 0 };
        });
        
        newPages[prev.currentPageIndex] = {
          ...currentPage,
          elements: rearrangedElements
        };
      } else {
        // Reset columnIndex for single column
        newPages[prev.currentPageIndex] = {
          ...currentPage,
          elements: currentPage.elements.map(el => ({ ...el, columnIndex: 0 }))
        };
      }

      return { ...prev, pages: newPages, columns, columnOffsets };
    });
  }, []);

  const setColumnOffsets = useCallback((offsets: number[]) => {
    setState(prev => ({ ...prev, columnOffsets: offsets }));
  }, []);

  return {
    state,
    canvasRef,
    startDrawing,
    updateDrawing,
    endDrawing,
    undo,
    redo,
    clearAll,
    setTool,
    setShape,
    setColor,
    setWidth,
    setMagnification,
    toggleSmartShape,
    addQuestion,
    selectQuestionOption,
    toggleQuestionAnswer,
    deleteElement,
    moveElement,
    addPage,
    removePage,
    setPage,
    setColumns,
    setColumnOffsets,
    toggleSelectMode,
  };
}
