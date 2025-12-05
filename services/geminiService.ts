import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateHolidayGreeting = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Write a very short, luxurious, and poetic Christmas greeting. The tone should be high-fashion, elegant, and magical. Use words like 'Golden', 'Eternal', 'Signature'. Max 2 sentences.",
    });

    return response.text || "May your holidays be wrapped in gold and eternal elegance.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Wishing you a season of timeless beauty and golden moments.";
  }
};
