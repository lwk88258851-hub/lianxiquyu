import React, { useState, useRef } from 'react';
import { FileUp, X, Check, Image as ImageIcon, Loader2, FileText, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QuestionData, QuestionOption } from '../types';
import { extractQuestionsFromMedia } from '../services/geminiService';

interface ImportQuestionProps {
  onImport: (data: QuestionData) => void;
}

export const ImportQuestion: React.FC<ImportQuestionProps> = ({ onImport }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseQuestion = () => {
    if (!inputText.trim()) return;

    // Basic parsing logic for MCQ
    // Format: "Stem text... A. Option1 B. Option2 C. Option3 D. Option4"
    const stemMatch = inputText.split(/[A-D][\.、\s]/)[0].trim();
    const options: QuestionOption[] = [];
    
    const optionRegex = /([A-D])[\.、\s]([^A-D]*)/g;
    let match;
    while ((match = optionRegex.exec(inputText)) !== null) {
      options.push({
        id: Math.random().toString(36).substr(2, 9),
        label: match[1],
        text: match[2].trim()
      });
    }

    // Try to find the correct answer (e.g., "答案：A" or "Correct: B")
    const answerMatch = inputText.match(/(?:答案|正确答案|Correct|Answer)[:：\s]*([A-D])/i);
    const correctAnswer = answerMatch ? answerMatch[1].toUpperCase() : undefined;

    if (options.length > 0) {
      onImport({
        stem: stemMatch || "未命名题目",
        options,
        imageUrl: imageUrl || undefined,
        correctAnswer
      });
      setInputText('');
      setImageUrl('');
      setIsOpen(false);
    } else {
      alert('未检测到选项，请确保包含 A. B. C. D. 等标识符');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const extracted = await extractQuestionsFromMedia(base64Data, file.type);
      
      const fileUrl = `data:${file.type};base64,${base64Data}`;

      if (extracted.length > 0) {
        extracted.forEach(q => {
          const correctAnswer = q.options.find(opt => opt.is_correct)?.key;
          
          onImport({
            stem: q.question_text,
            options: q.options.map(opt => ({
              id: Math.random().toString(36).substr(2, 9),
              label: opt.key,
              text: opt.value
            })),
            imageUrl: q.question_image || (file.type.startsWith('image/') ? fileUrl : undefined),
            correctAnswer: correctAnswer,
            explanation: q.answer_explanation || undefined
          });
        });
        setIsOpen(false);
      } else {
        alert('未能从文件中识别出题目，请尝试手动输入或更换清晰的图片。');
      }
    } catch (error) {
      console.error('File processing error:', error);
      alert('处理文件时出错，请稍后重试。');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed top-6 right-6 z-50">
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/90 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl text-white hover:bg-zinc-800 transition-all group"
      >
        <FileUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="text-sm font-medium">导入题目</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute right-0 mt-4 w-96 bg-zinc-900 border border-white/10 rounded-2xl shadow-3xl p-6 pointer-events-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-emerald-400" />
                  导入选择题
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                    )}
                    <span className="text-[10px] text-white/60 font-medium">上传图片</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    ) : (
                      <FileText className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                    )}
                    <span className="text-[10px] text-white/60 font-medium">上传 PDF</span>
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,.pdf"
                  className="hidden"
                />

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                    <span className="bg-zinc-900 px-2 text-white/20">或者手动输入</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest block mb-2">题目文本</label>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="请输入题目内容，例如：
1. 太阳系中最大的行星是？
A. 地球
B. 木星
C. 火星
D. 土星"
                    className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest block mb-2">图片链接 (可选)</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                </div>

                <button
                  onClick={parseQuestion}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  立即生成
                </button>
                
                <p className="text-[10px] text-white/30 text-center">
                  系统将自动识别题干与 A/B/C/D 选项
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
