import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function recognizeHandwriting(base64Image: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp", // Using a fast model for OCR
      contents: [
        {
          parts: [
            { text: "Convert the handwriting in this image to plain text. Only return the text found, nothing else." },
            { inlineData: { mimeType: "image/png", data: base64Image.split(',')[1] } }
          ]
        }
      ]
    });
    return response.text || "";
  } catch (error) {
    console.error("AI Recognition Error:", error);
    return "";
  }
}

export async function refineShape(points: {x: number, y: number}[]): Promise<{ type: 'circle' | 'rectangle' | 'line', confidence: number }> {
  // This could be a local heuristic or an AI call. 
  // For speed, let's implement a basic heuristic in the hook, 
  // but we could use Gemini to "classify" the shape if it's complex.
  return { type: 'line', confidence: 0 }; 
}
