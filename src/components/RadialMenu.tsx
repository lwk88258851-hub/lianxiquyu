import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Pen, 
  Eraser, 
  Undo2, 
  Redo2, 
  MousePointer2, 
  Highlighter, 
  Circle, 
  Square, 
  Minus,
  Settings2,
  Search,
  Sun,
  Shapes,
  Triangle,
  RotateCcw
} from 'lucide-react';
import { ToolType, ShapeType, COLORS, WIDTHS } from '../types';

interface RadialMenuProps {
  activeTool: ToolType;
  onToolSelect: (tool: ToolType) => void;
  onShapeSelect: (shape: ShapeType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onColorSelect: (color: string) => void;
  onWidthSelect: (width: number) => void;
  onMagnificationSelect: (magnification: number) => void;
  onResetColumns: () => void;
  currentColor: string;
  currentWidth: number;
  currentMagnification: number;
}

export const RadialMenu: React.FC<RadialMenuProps> = ({
  activeTool,
  onToolSelect,
  onShapeSelect,
  onUndo,
  onRedo,
  onClear,
  onColorSelect,
  onWidthSelect,
  onMagnificationSelect,
  onResetColumns,
  currentColor,
  currentWidth,
  currentMagnification
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 120, y: window.innerHeight - 120 });
  const [activeSubMenu, setActiveSubMenu] = useState<'none' | 'brush' | 'eraser' | 'shape' | 'magnifier' | 'undo'>('none');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const clickCount = useRef(0);
  const lastClickTime = useRef(0);
  const isLongPress = useRef(false);

  // Handle long press to summon
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setPosition({ x: e.clientX, y: e.clientY });
      setIsOpen(true);
    };

    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  const menuItems = [
    { id: 'pen', icon: Pen, label: '笔', color: 'bg-emerald-500' },
    { id: 'highlighter', icon: Highlighter, label: '荧光笔', color: 'bg-amber-500' },
    { id: 'shape', icon: Shapes, label: '几何图形', color: 'bg-indigo-500' },
    { id: 'spotlight', icon: Sun, label: '聚光灯', color: 'bg-yellow-500' },
    { id: 'magnifier', icon: Search, label: '放大镜', color: 'bg-blue-500' },
    { id: 'eraser', icon: Eraser, label: '橡皮擦', color: 'bg-slate-500' },
    { id: 'undo', icon: Undo2, label: '撤销/重做', color: 'bg-zinc-700' },
  ];

  const shapeItems = [
    { id: 'line', icon: Minus, label: '直线' },
    { id: 'rectangle', icon: Square, label: '矩形' },
    { id: 'circle', icon: Circle, label: '圆形' },
    { id: 'right-triangle', icon: Triangle, label: '直角三角形' },
    { id: 'isosceles-triangle', icon: Triangle, label: '等腰三角形' },
    { id: 'equilateral-triangle', icon: Triangle, label: '等边三角形' },
  ];

  const radius = 120;
  const subRadius = 190;

  // Edge detection adjustment
  const adjustedPosition = useMemo(() => {
    const margin = 200;
    let { x, y } = position;
    if (x < margin) x = margin;
    if (x > window.innerWidth - margin) x = window.innerWidth - margin;
    if (y < margin) y = margin;
    if (y > window.innerHeight - margin) y = window.innerHeight - margin;
    return { x, y };
  }, [position]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for closing */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="absolute inset-0 pointer-events-auto"
              onClick={() => {
                setIsOpen(false);
                setActiveSubMenu('none');
              }}
            />

            {/* Main Radial Menu */}
            <div 
              className="absolute pointer-events-auto"
              style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
            >
              {/* Tooltip */}
              <AnimatePresence>
                {hoveredItem && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: -60 }}
                    exit={{ opacity: 0, y: 10, transition: { duration: 0.1 } }}
                    className="absolute left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-900 border border-white/20 rounded-lg shadow-xl text-white text-xs font-medium whitespace-nowrap pointer-events-none z-20"
                  >
                    {hoveredItem}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Center Button */}
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0, transition: { duration: 0.1 } }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-zinc-900 border-2 border-white/20 flex items-center justify-center shadow-2xl z-10"
                onClick={() => setIsOpen(false)}
              >
                <Settings2 className="text-white w-8 h-8" />
              </motion.button>

              {/* Menu Items */}
              {menuItems.map((item, index) => {
                const angle = (index / menuItems.length) * Math.PI * 2 - Math.PI / 2;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return (
                  <motion.button
                    key={item.id}
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                    animate={{ x, y, opacity: 1, scale: 1 }}
                    exit={{ x: 0, y: 0, opacity: 0, scale: 0, transition: { duration: 0.1 } }}
                    transition={{ delay: index * 0.03, type: 'spring', stiffness: 300, damping: 20 }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                    onMouseEnter={() => setHoveredItem(item.label)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onPointerDown={(e) => {
                      if (item.id === 'eraser') {
                        isLongPress.current = false;
                        pressTimer.current = setTimeout(() => {
                          isLongPress.current = true;
                          setActiveSubMenu('eraser');
                        }, 500);
                      }
                    }}
                    onPointerUp={() => {
                      if (pressTimer.current) {
                        clearTimeout(pressTimer.current);
                        pressTimer.current = null;
                      }
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center shadow-lg border border-white/10 ${
                      activeTool === item.id ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''
                    } ${item.color}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      
                      if (item.id === 'eraser') {
                        if (isLongPress.current) {
                          isLongPress.current = false;
                          return;
                        }
                        
                        const now = Date.now();
                        if (now - lastClickTime.current < 300) {
                          // Double click
                          onClear();
                          setIsOpen(false);
                          return;
                        }
                        lastClickTime.current = now;
                        
                        // Single click: normal eraser
                        onToolSelect('eraser');
                        onWidthSelect(16); // Normal size
                        setActiveSubMenu('none');
                        return;
                      }

                      const itemWithAction = item as { action?: () => void; id: string };
                      if (itemWithAction.action) {
                        itemWithAction.action();
                      } else {
                        // Only call onToolSelect for actual tool types
                        const toolIds = ['pen', 'highlighter', 'eraser', 'shape', 'spotlight', 'magnifier', 'text'];
                        if (toolIds.includes(item.id)) {
                          onToolSelect(item.id as ToolType);
                        }
                        
                        if (item.id === 'pen' || item.id === 'highlighter') {
                          setActiveSubMenu(activeSubMenu === 'brush' ? 'none' : 'brush');
                        } else if (item.id === 'shape') {
                          setActiveSubMenu(activeSubMenu === 'shape' ? 'none' : 'shape');
                        } else if (item.id === 'magnifier') {
                          setActiveSubMenu(activeSubMenu === 'magnifier' ? 'none' : 'magnifier');
                        } else if (item.id === 'undo') {
                          setActiveSubMenu(activeSubMenu === 'undo' ? 'none' : 'undo');
                        } else {
                          setActiveSubMenu('none');
                        }
                      }
                    }}
                  >
                    <item.icon className="text-white w-6 h-6" />
                  </motion.button>
                );
              })}

              {/* Sub-menus: Floating Panel Style */}
              <AnimatePresence>
                {activeSubMenu !== 'none' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20, scale: 0.95 }}
                    animate={{ 
                      opacity: 1, 
                      x: adjustedPosition.x > window.innerWidth / 2 ? -radius - 220 : radius + 20,
                      scale: 1 
                    }}
                    exit={{ opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.1 } }}
                    className="absolute top-1/2 -translate-y-1/2 w-48 bg-white border border-zinc-200 rounded-2xl shadow-2xl p-4 flex flex-col gap-4 pointer-events-auto"
                  >
                    {/* Brush Sub-menu */}
                    {activeSubMenu === 'brush' && (
                      <>
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] text-red-500/60 uppercase font-bold tracking-widest">颜色选择</span>
                          <div className="grid grid-cols-4 gap-2">
                            {COLORS.map((color) => (
                              <button
                                key={color}
                                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                                  currentColor === color ? 'border-red-500' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onColorSelect(color);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] text-red-500/60 uppercase font-bold tracking-widest">粗细调节</span>
                          <div className="flex items-center justify-between bg-red-50 rounded-xl p-2">
                            {WIDTHS.map((width) => (
                              <button
                                key={width}
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                                  currentWidth === width ? 'bg-red-500' : 'hover:bg-red-100'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onWidthSelect(width);
                                }}
                              >
                                <div 
                                  className={`rounded-full ${currentWidth === width ? 'bg-white' : 'bg-red-500'}`} 
                                  style={{ width: Math.max(2, width / 4), height: Math.max(2, width / 4) }} 
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Eraser Sub-menu */}
                    {activeSubMenu === 'eraser' && (
                      <>
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] text-red-500/60 uppercase font-bold tracking-widest">擦除粗细</span>
                          <div className="flex items-center justify-between bg-red-50 rounded-xl p-2">
                            {WIDTHS.map((width) => (
                              <button
                                key={width}
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                                  currentWidth === width ? 'bg-red-500' : 'hover:bg-red-100'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onWidthSelect(width);
                                }}
                              >
                                <div 
                                  className={`rounded-full border ${currentWidth === width ? 'bg-white border-white' : 'bg-transparent border-red-500/40'}`} 
                                  style={{ width: width / 4 + 2, height: width / 4 + 2 }} 
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          className="w-full py-3 rounded-xl bg-red-500 border border-red-600 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClear();
                          }}
                        >
                          <RotateCcw className="w-4 h-4" />
                          清空画布
                        </button>
                      </>
                    )}

                    {/* Shape Sub-menu */}
                    {activeSubMenu === 'shape' && (
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] text-red-500/60 uppercase font-bold tracking-widest">几何图形</span>
                        <div className="grid grid-cols-2 gap-2">
                          {shapeItems.map((shape) => (
                            <button
                              key={shape.id}
                              className="flex flex-col items-center gap-1 p-2 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100 hover:border-red-200 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                onShapeSelect(shape.id as ShapeType);
                              }}
                            >
                              <shape.icon className="w-5 h-5 text-red-500" />
                              <span className="text-[9px] text-red-600 font-medium">{shape.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Magnifier Sub-menu */}
                    {activeSubMenu === 'magnifier' && (
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] text-red-500/60 uppercase font-bold tracking-widest">放大倍数</span>
                        <div className="flex items-center justify-between bg-red-50 rounded-xl p-2">
                          {[1.5, 2, 3, 4].map((zoom) => (
                            <button
                              key={zoom}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors ${
                                currentMagnification === zoom ? 'bg-red-500 text-white' : 'text-red-500/60 hover:bg-red-100'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onMagnificationSelect(zoom);
                              }}
                            >
                              {zoom}x
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Undo Sub-menu */}
                    {activeSubMenu === 'undo' && (
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] text-red-500/60 uppercase font-bold tracking-widest">历史记录</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100 hover:border-red-200 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUndo();
                            }}
                          >
                            <Undo2 className="w-5 h-5 text-red-500" />
                            <span className="text-[9px] text-red-600 font-medium">撤销</span>
                          </button>
                          <button
                            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100 hover:border-red-200 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRedo();
                            }}
                          >
                            <Redo2 className="w-5 h-5 text-red-500" />
                            <span className="text-[9px] text-red-600 font-medium">重做</span>
                          </button>
                        </div>
                        <button
                          className="w-full py-3 mt-2 rounded-xl bg-red-500 border border-red-600 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            onResetColumns();
                          }}
                        >
                          <RotateCcw className="w-4 h-4" />
                          还原分栏
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Persistent Floating Indicator */}
      {!isOpen && (
        <motion.div
          drag
          dragMomentum={false}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 right-8 pointer-events-auto z-50"
          onDragEnd={(_, info) => {
            setPosition({ 
              x: window.innerWidth - 32 + info.point.x - window.innerWidth, 
              y: window.innerHeight - 32 + info.point.y - window.innerHeight 
            });
          }}
        >
          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-zinc-900/90 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl hover:bg-zinc-800 transition-colors cursor-grab active:cursor-grabbing"
          >
            <MousePointer2 className="text-white w-6 h-6" />
          </button>
        </motion.div>
      )}
    </div>
  );
};
