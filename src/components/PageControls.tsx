import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Columns, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PageControlsProps {
  currentPageIndex: number;
  totalPages: number;
  columns: number;
  onAddPage: () => void;
  onRemovePage: (index: number) => void;
  onSetPage: (index: number) => void;
  onSetColumns: (columns: number) => void;
}

export const PageControls: React.FC<PageControlsProps> = ({
  currentPageIndex,
  totalPages,
  columns,
  onAddPage,
  onRemovePage,
  onSetPage,
  onSetColumns,
}) => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-white/80 backdrop-blur-xl border border-zinc-200 rounded-full shadow-2xl z-50">
      {/* Partitioning Controls */}
      <div className="flex items-center gap-2 pr-4 border-r border-zinc-200">
        <button
          onClick={() => onSetColumns(Math.max(1, columns - 1))}
          className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-600"
          title="减少分栏"
        >
          <Columns size={16} className="rotate-90" />
        </button>
        <div className="flex items-center gap-1 px-2">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">分栏</span>
          <span className="text-sm font-mono font-bold text-zinc-800 w-4 text-center">{columns}</span>
        </div>
        <button
          onClick={() => onSetColumns(Math.min(4, columns + 1))}
          className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-600"
          title="增加分栏"
        >
          <Columns size={16} />
        </button>
        {columns > 1 && (
          <button
            onClick={() => onSetColumns(columns)}
            className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-indigo-500 ml-1"
            title="还原等宽分栏"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSetPage(Math.max(0, currentPageIndex - 1))}
          disabled={currentPageIndex === 0}
          className="p-2 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-full transition-all text-zinc-600"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-1.5"
            >
              <span className="text-sm font-bold text-zinc-800">第 {currentPageIndex + 1} 页</span>
              <span className="text-xs text-zinc-400">/ {totalPages}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={() => onSetPage(Math.min(totalPages - 1, currentPageIndex + 1))}
          disabled={currentPageIndex === totalPages - 1}
          className="p-2 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-full transition-all text-zinc-600"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2 pl-4 border-l border-zinc-200">
        <button
          onClick={onAddPage}
          className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full transition-all group"
          title="添加新页"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
        
        {totalPages > 1 && (
          <button
            onClick={() => onRemovePage(currentPageIndex)}
            className="p-2 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-full transition-all"
            title="删除当前页"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
