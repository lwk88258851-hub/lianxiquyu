import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MousePointer2, Pen } from 'lucide-react';
import { useWhiteboard } from '../hooks/useWhiteboard';
import { Point, DrawingPath, TextElement, QuestionElement } from '../types';
import { QuestionRenderer } from './QuestionRenderer';

interface WhiteboardProps {
  whiteboard: ReturnType<typeof useWhiteboard>;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({ whiteboard }) => {
  const { state, canvasRef, startDrawing, updateDrawing, endDrawing, setColumnOffsets, toggleSelectMode } = whiteboard;
  const currentPage = state.pages[state.currentPageIndex];
  const [draggingDividerIndex, setDraggingDividerIndex] = useState<number | null>(null);
  const [showToolIndicator, setShowToolIndicator] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const lastPointerPos = useRef({ x: 0, y: 0 });
  const requestRef = useRef<number>();

  const drawPath = (ctx: CanvasRenderingContext2D, path: DrawingPath | { points: Point[]; color: string; width: number; opacity: number; type?: string; shapeType?: string }) => {
    if (path.points.length < 2) return;

    ctx.save();
    
    if (path.type === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = path.color;
    ctx.lineWidth = path.width;
    ctx.globalAlpha = path.opacity;

    if (path.type === 'shape' && path.shapeType) {
      const start = path.points[0];
      const end = path.points[path.points.length - 1];
      const width = end.x - start.x;
      const height = end.y - start.y;

      switch (path.shapeType) {
        case 'line':
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          break;
        case 'rectangle':
          ctx.strokeRect(start.x, start.y, width, height);
          break;
        case 'circle':
          const radius = Math.sqrt(width * width + height * height) / 2;
          const centerX = start.x + width / 2;
          const centerY = start.y + height / 2;
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          break;
        case 'right-triangle':
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(start.x, end.y);
          ctx.lineTo(end.x, end.y);
          ctx.closePath();
          break;
        case 'isosceles-triangle':
          ctx.moveTo(start.x + width / 2, start.y);
          ctx.lineTo(start.x, end.y);
          ctx.lineTo(end.x, end.y);
          ctx.closePath();
          break;
        case 'equilateral-triangle':
          const side = Math.max(Math.abs(width), Math.abs(height));
          const h = side * (Math.sqrt(3) / 2);
          const xDir = width > 0 ? 1 : -1;
          const yDir = height > 0 ? 1 : -1;
          ctx.moveTo(start.x + (side / 2) * xDir, start.y);
          ctx.lineTo(start.x, start.y + h * yDir);
          ctx.lineTo(start.x + side * xDir, start.y + h * yDir);
          ctx.closePath();
          break;
      }
    } else {
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        const xc = (path.points[i].x + path.points[i - 1].x) / 2;
        const yc = (path.points[i].y + path.points[i - 1].y) / 2;
        ctx.quadraticCurveTo(path.points[i - 1].x, path.points[i - 1].y, xc, yc);
      }
    }

    ctx.stroke();
    ctx.restore();
  };

  const drawText = (ctx: CanvasRenderingContext2D, element: TextElement) => {
    ctx.save();
    ctx.font = `${element.fontSize}px ${element.fontFamily}`;
    ctx.fillStyle = element.color;
    ctx.textBaseline = 'top';
    
    // Handle multiline text
    const lines = element.text.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, element.x, element.y + i * element.fontSize * 1.2);
    });
    
    ctx.restore();
  };

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Column Dividers
    if (state.columns > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      state.columnOffsets.forEach(offset => {
        ctx.moveTo(offset, 0);
        ctx.lineTo(offset, canvas.height);
      });
      ctx.stroke();
      ctx.restore();
    }

    // Draw all saved elements
    currentPage.elements.forEach(element => {
      const colIndex = element.columnIndex ?? 0;
      const left = colIndex === 0 ? 0 : state.columnOffsets[colIndex - 1];
      const right = colIndex === state.columns - 1 ? canvas.width : state.columnOffsets[colIndex];

      ctx.save();
      // Apply clipping for the column
      ctx.beginPath();
      ctx.rect(left, 0, right - left, canvas.height);
      ctx.clip();

      if ('points' in element) {
        drawPath(ctx, element as DrawingPath);
      } else if (element.type === 'text') {
        drawText(ctx, element as TextElement);
      }
      ctx.restore();
    });

    // Draw current path with clipping
    if (state.currentPath && !['spotlight', 'magnifier', 'select'].includes(state.currentPath.type)) {
      const colIndex = state.currentPath.columnIndex ?? 0;
      const left = colIndex === 0 ? 0 : state.columnOffsets[colIndex - 1];
      const right = colIndex === state.columns - 1 ? canvas.width : state.columnOffsets[colIndex];

      ctx.save();
      ctx.beginPath();
      ctx.rect(left, 0, right - left, canvas.height);
      ctx.clip();
      drawPath(ctx, state.currentPath);
      ctx.restore();
    }

    // Draw Lasso Selection
    if (state.currentPath && state.currentPath.type === 'select') {
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#60A5FA';
      ctx.lineWidth = 2;
      ctx.moveTo(state.currentPath.points[0].x, state.currentPath.points[0].y);
      state.currentPath.points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(96, 165, 250, 0.1)';
      ctx.fill();
      ctx.restore();
    }

    // Draw Spotlight / Magnifier overlay
    if (state.currentPath && (state.currentPath.type === 'spotlight' || state.currentPath.type === 'magnifier')) {
      const lastPoint = state.currentPath.points[state.currentPath.points.length - 1];
      const radius = 120;

      if (state.currentPath.type === 'spotlight') {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.arc(lastPoint.x, lastPoint.y, radius, 0, Math.PI * 2, true);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fill();
        
        // Spotlight glow
        const gradient = ctx.createRadialGradient(lastPoint.x, lastPoint.y, radius - 20, lastPoint.x, lastPoint.y, radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
      } else if (state.currentPath.type === 'magnifier') {
        // Real Magnification Effect
        ctx.save();
        
        // Create a circular clip for the magnifier
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, radius, 0, Math.PI * 2);
        ctx.clip();

        // Draw the zoomed content
        // We need to draw the paths again but scaled
        ctx.translate(lastPoint.x, lastPoint.y);
        ctx.scale(state.magnification, state.magnification);
        ctx.translate(-lastPoint.x, -lastPoint.y);
        
        currentPage.elements.forEach(element => {
          if ('points' in element) {
            drawPath(ctx, element as DrawingPath);
          } else {
            drawText(ctx, element as TextElement);
          }
        });
        
        ctx.restore();

        // Draw magnifier frame
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 6;
        ctx.stroke();
        
        // Glass reflection
        const glassGrad = ctx.createLinearGradient(lastPoint.x - radius, lastPoint.y - radius, lastPoint.x + radius, lastPoint.y + radius);
        glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        glassGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
        ctx.fillStyle = glassGrad;
        ctx.fill();
      }
    }
  };

  useEffect(() => {
    render();
  }, [currentPage.elements, state.currentPath, state.columns, state.columnOffsets]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        render();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    lastPointerPos.current = { x, y };
    
    // Long press detection
    longPressTimer.current = setTimeout(() => {
      toggleSelectMode();
      setShowToolIndicator(true);
      setTimeout(() => setShowToolIndicator(false), 1500);
    }, 500);

    startDrawing(x, y, e.pressure);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (longPressTimer.current) {
      const dx = x - lastPointerPos.current.x;
      const dy = y - lastPointerPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If moved more than 10px, cancel long press
      if (distance > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }

    if (draggingDividerIndex !== null) return; // Handled by divider's own listeners

    updateDrawing(x, y, e.pressure);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    endDrawing();
  };

  const handleDividerDrag = (index: number, e: React.PointerEvent) => {
    if (draggingDividerIndex !== index) return;
    
    const rect = canvasRef.current?.parentElement?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const newOffsets = [...state.columnOffsets];
    
    // Constraints: don't cross other dividers or edges
    const min = index === 0 ? 50 : state.columnOffsets[index - 1] + 50;
    const max = index === state.columnOffsets.length - 1 ? rect.width - 50 : state.columnOffsets[index + 1] - 50;
    
    const clampedX = Math.max(min, Math.min(max, x));
    
    // Only update if changed to reduce unnecessary renders
    if (newOffsets[index] !== clampedX) {
      newOffsets[index] = clampedX;
      setColumnOffsets(newOffsets);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full bg-white touch-none ${state.activeTool === 'select' ? 'cursor-default' : 'cursor-crosshair'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {/* Draggable Dividers */}
      {state.columnOffsets.map((offset, index) => (
        <div
          key={`divider-${index}`}
          className={`absolute top-0 bottom-0 w-8 -ml-4 z-40 touch-none ${state.activeTool === 'select' ? 'cursor-col-resize group' : 'pointer-events-none'}`}
          style={{ left: offset }}
          onPointerDown={(e) => {
            if (state.activeTool !== 'select') return;
            e.stopPropagation();
            e.currentTarget.setPointerCapture(e.pointerId);
            setDraggingDividerIndex(index);
          }}
          onPointerMove={(e) => handleDividerDrag(index, e)}
          onPointerUp={(e) => {
            e.currentTarget.releasePointerCapture(e.pointerId);
            setDraggingDividerIndex(null);
          }}
        >
          <div className={`absolute inset-y-0 left-1/2 w-0.5 transition-colors duration-75 ${draggingDividerIndex === index ? 'bg-indigo-600 w-1' : 'bg-zinc-200 group-hover:bg-indigo-400'}`} />
          {state.activeTool === 'select' && (
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-12 bg-white border border-zinc-200 rounded-xl shadow-2xl flex items-center justify-center transition-all duration-75 ${draggingDividerIndex === index ? 'scale-110 opacity-100 shadow-indigo-500/20' : 'opacity-0 group-hover:opacity-100'}`}>
              <div className="flex gap-1">
                <div className={`w-0.5 h-4 rounded-full transition-colors ${draggingDividerIndex === index ? 'bg-indigo-400' : 'bg-zinc-300'}`} />
                <div className={`w-0.5 h-4 rounded-full transition-colors ${draggingDividerIndex === index ? 'bg-indigo-400' : 'bg-zinc-300'}`} />
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Tool Indicator Overlay */}
      <AnimatePresence>
        {showToolIndicator && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3 bg-zinc-900/90 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl flex items-center gap-3 z-[100]"
          >
            {state.activeTool === 'select' ? (
              <>
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <MousePointer2 className="text-white w-4 h-4" />
                </div>
                <span className="text-white font-medium">已切换至光标模式 (可拖动分栏)</span>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Pen className="text-white w-4 h-4" />
                </div>
                <span className="text-white font-medium">已切换至写字模式</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Question Elements Overlay */}
      {currentPage.elements.filter(el => el.type === 'question').map(el => {
        const qEl = el as QuestionElement;
        const colIndex = qEl.columnIndex ?? 0;
        const left = colIndex === 0 ? 0 : state.columnOffsets[colIndex - 1];
        const right = colIndex === state.columns - 1 ? (canvasRef.current?.width || window.innerWidth) : state.columnOffsets[colIndex];
        const canvasWidth = canvasRef.current?.width || window.innerWidth;
        
        return (
          <div 
            key={el.id}
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ 
              clipPath: `inset(0px ${Math.max(0, canvasWidth - right)}px 0px ${left}px)`,
              transition: draggingDividerIndex !== null ? 'none' : 'clip-path 0.2s ease-out'
            }}
          >
            <div className="pointer-events-auto contents">
              <QuestionRenderer
                element={qEl}
                onSelectOption={(optionId) => whiteboard.selectQuestionOption(el.id, optionId)}
                onToggleAnswer={() => whiteboard.toggleQuestionAnswer(el.id)}
                onDelete={() => whiteboard.deleteElement(el.id)}
                onMove={(x, y) => whiteboard.moveElement(el.id, x, y)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
