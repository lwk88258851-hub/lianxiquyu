import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ExtractedQuestion {
  question_text: string;
  question_image: string | null;
  options: { key: string; value: string; is_correct: boolean | null }[];
  answer_explanation: string | null;
}

export const extractQuestionsFromMedia = async (
  base64Data: string,
  mimeType: string
): Promise<ExtractedQuestion[]> => {
  const model = "gemini-2.0-flash-exp";

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType,
            },
          },
          {
            text: `# Role
你是一个专业的教育数据解析专家和 OCR 文本结构化助手。你的任务是从用户提供的图片、PDF 文本或混合输入中，精准提取选择题（单选/多选）的所有要素，并将其转化为标准化的 JSON 格式，以便下游系统生成交互式答题卡片。

# Task
仔细分析用户输入的内容，识别出所有的选择题，并分离出“题干”、“选项”、“配图信息”以及“答案/解析（如有）”。

# Rules
1. **题干识别 (Question Stem):** 准确提取问题的核心描述。去除无意义的序号（如 1., 2., (1) 等），只保留问题文本。
2. **选项提取 (Options):** - 识别 A、B、C、D 等选项标识。
   - 将选项字母与选项内容分离。
   - 确保即使选项换行或排版混乱，也能准确归属于正确的选项字母下。
3. **配图信息处理 (Images):** - 如果题目或选项中包含明显的配图说明、占位符或图片链接（如 \`https://...\` 或 \`[图片]\`），请将其提取到 \`question_image\` 字段。
   - 如果没有配图，该字段留空或设为 null。
4. **答案与解析 (Answer & Explanation):** 如果文本中包含正确答案或解析，请一并提取；如果没有，则设为 null。
5. **去噪 (Denoising):** 忽略页眉、页脚、页码、水印或与题目无关的背景文字。
6. **严格的 JSON 输出:** 你只能输出合法的 JSON 数组结构，**不要包含任何 Markdown 标记（如 \`\`\`json）、不要有任何解释性文字**。确保可以直接被 \`JSON.parse()\` 解析。
7. **数学公式规范**: 所有的数学符号、公式（如圆 $\odot$、角 $\angle$、分数、根号、几何符号等）**必须**使用 LaTeX 格式，并用单个 $ 符号包围（例如：$\odot O$，$PA = 6$）。不要使用任何非标准的特殊字符。`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question_text: { type: Type.STRING },
            question_image: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  key: { type: Type.STRING },
                  value: { type: Type.STRING },
                  is_correct: { type: Type.BOOLEAN },
                },
                required: ["key", "value"],
              },
            },
            answer_explanation: { type: Type.STRING },
          },
          required: ["question_text", "options"],
        },
      },
    },
  });

  try {
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    return [];
  }
};
