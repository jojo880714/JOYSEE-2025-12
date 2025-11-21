import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY;

// Initialize generically; actual calls will check for key presence
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface SuggestionParams {
  color: string;
  occasion: string;
  feeling: string;
  budgetMin: number;
  budgetMax: number;
}

export const getGiftSuggestions = async (params: SuggestionParams): Promise<Array<{ name: string; description: string }>> => {
  if (!ai) {
    console.warn("API Key not found");
    return [
      { name: "API Key 未設定", description: "請設定 API Key 以獲得 AI 建議。" },
      { name: "手作卡片", description: "充滿心意與溫度的經典選擇。" },
      { name: "香氛蠟燭", description: "適合各種場合的安全牌。" }
    ];
  }

  const prompt = `
    情境: 聖誕節交換禮物活動 (Secret Santa)。
    使用者偏好:
    - 喜歡的色系: ${params.color}
    - 使用場合/情境: ${params.occasion}
    - 感覺/風格 (Vibe): ${params.feeling}
    - 預算範圍: $${params.budgetMin} - $${params.budgetMax}
    
    任務: 根據上述條件，建議 3 個具體、有創意且符合預算的禮物點子。
    
    回應格式: 請回傳 JSON 格式。
    語言: 繁體中文 (Traditional Chinese, Taiwan)。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "禮物名稱" },
              description: { type: Type.STRING, description: "推薦原因簡述 (20字以內)" }
            },
            required: ["name", "description"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("無法取得禮物建議。");
  }
};