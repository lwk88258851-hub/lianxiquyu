import React, { useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { QuestionElement } from '../types';
import { CheckCircle2, XCircle, Eye, EyeOff, Trash2, GripHorizontal } from 'lucide-react';
import { MathText } from './MathText';

interface QuestionRendererProps {
  element: QuestionElement;
  onSelectOption: (optionId: string) => void;
  onToggleAnswer: () => void;
  onDelete: () => void;
  onMove: (x: number, y: number) => void;
}

export const QuestionRenderer = React.memo<QuestionRendererProps>(({
  element,
  onSelectOption,
  onToggleAnswer,
  onDelete,
  onMove
}) => {
  const { data, selectedOptionId, isAnswerRevealed } = element;
  const [isHovered, setIsHovered] = useState(false);
  const dragControls = useDragControls();

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        onMove(element.x + info.offset.x, element.y + info.offset.y);
      }}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="absolute bg-white/95 backdrop-blur-xl border border-zinc-200 rounded-3xl shadow-2xl p-6 flex flex-col gap-6 pointer-events-auto group"
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        minHeight: element.height,
        zIndex: 10
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <GripHorizontal className="w-5 h-5 text-indigo-500" />
          </div>
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">选择题</span>
        </div>
        
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onToggleAnswer}
            className={`p-2 rounded-xl transition-colors ${
              isAnswerRevealed ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-100 text-zinc-400 hover:text-zinc-600'
            }`}
            title={isAnswerRevealed ? "隐藏答案" : "显示答案"}
          >
            {isAnswerRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
            title="删除题目"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stem */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-800 leading-relaxed">
          <MathText text={data.stem} />
        </h2>
        
        {data.imageUrl && (
          <div className="relative rounded-2xl overflow-hidden border border-zinc-100 shadow-inner bg-zinc-50">
            <img
              src={data.imageUrl}
              alt="Question"
              className="w-full h-auto max-h-48 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3">
        {data.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrect = isAnswerRevealed && option.label === data.correctAnswer;
          const isWrong = isAnswerRevealed && isSelected && option.label !== data.correctAnswer;

          return (
            <button
              key={option.id}
              onClick={() => onSelectOption(option.id)}
              className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                isSelected
                  ? 'bg-indigo-500/5 border-indigo-500 shadow-lg shadow-indigo-500/10'
                  : 'bg-zinc-50 border-transparent hover:bg-zinc-100 hover:border-zinc-200'
              } ${isCorrect ? 'bg-emerald-500/5 border-emerald-500' : ''} ${
                isWrong ? 'bg-red-500/5 border-red-500' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-colors ${
                isSelected ? 'bg-indigo-500 text-white' : 'bg-white text-zinc-400 border border-zinc-200'
              } ${isCorrect ? 'bg-emerald-500 text-white' : ''} ${
                isWrong ? 'bg-red-500 text-white' : ''
              }`}>
                {option.label}
              </div>
              
              <span className={`flex-1 font-medium ${isSelected ? 'text-indigo-900' : 'text-zinc-600'}`}>
                <MathText text={option.text} />
              </span>

              <AnimatePresence>
                {isCorrect && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-emerald-500"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </motion.div>
                )}
                {isWrong && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-red-500"
                  >
                    <XCircle className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      {/* Footer / Answer Hint & Explanation */}
      {isAnswerRevealed && data.correctAnswer && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
              {data.correctAnswer}
            </div>
            <span className="text-emerald-700 font-bold">正确答案</span>
          </div>
          
          {data.explanation && (
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 text-sm text-zinc-600 leading-relaxed">
              <span className="font-bold text-zinc-400 block mb-1 uppercase text-[10px] tracking-widest">解析</span>
              <MathText text={data.explanation} />
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}, (prev, next) => {
  return (
    prev.element === next.element &&
    prev.onSelectOption === next.onSelectOption &&
    prev.onToggleAnswer === next.onToggleAnswer &&
    prev.onDelete === next.onDelete &&
    prev.onMove === next.onMove
  );
});
