
import { GoogleGenAI, Type } from "@google/genai";
import { VideoStyle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function splitScriptIntoVoiceSegments(
  rawScript: string,
  language: string
): Promise<{ id: number; voiceText: string }[]> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      Nhiệm vụ: Chia kịch bản sau thành các đoạn lời thoại (voiceover). 
      Mỗi đoạn PHẢI có độ dài vừa đủ để đọc trong chính xác 8 giây.
      
      Quy tắc:
      - Khoảng 20-25 từ tiếng Việt hoặc 25-30 từ tiếng Anh cho mỗi đoạn.
      - Ngôn ngữ: ${language}.
      - Kịch bản gốc: "${rawScript}"
      
      Trả về mảng JSON các đối tượng: {"id": number, "voiceText": string}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          segments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                voiceText: { type: Type.STRING }
              },
              required: ["id", "voiceText"]
            }
          }
        },
        required: ["segments"]
      }
    }
  });

  const parsed = JSON.parse(response.text || '{"segments":[]}');
  return parsed.segments;
}

export async function generatePromptForSegment(
  voiceText: string,
  style: VideoStyle
): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      Nhiệm vụ: Tạo một Visual Prompt tiếng Anh chi tiết cho mô hình video Veo3/Sora.
      Nội dung hình ảnh phải khớp với lời thoại sau: "${voiceText}"
      Phong cách video: ${style}
      Thời lượng: 8 giây.
      
      Yêu cầu: Chỉ trả về đoạn văn bản prompt tiếng Anh, không thêm giải thích.
    `
  });

  return response.text || "Failed to generate prompt.";
}
