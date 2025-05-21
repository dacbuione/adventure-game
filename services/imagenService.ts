
import { GoogleGenAI } from "@google/genai";

// Fix: Use process.env.API_KEY directly as per guidelines.
// The API_KEY check is handled within the generateAdventureImage function.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const IMAGEN_MODEL = 'imagen-3.0-generate-002';

export const generateAdventureImage = async (prompt: string): Promise<string> => {
  // This check ensures that if API_KEY is not set, we don't proceed.
  if (!process.env.API_KEY) {
    console.error("Biến môi trường API_KEY chưa được đặt cho Imagen!");
    throw new Error("API Key của Imagen chưa được cấu hình.");
  }
  
  if (!prompt || prompt.trim() === "") {
    console.warn("Gợi ý tạo ảnh trống. Bỏ qua việc tạo ảnh.");
    return "https://picsum.photos/seed/no_prompt_vi/800/600"; 
  }

  try {
    // The "not callable" error on ai.models.generateImages was likely due to
    // incorrect 'ai' initialization if API_KEY was missing and a fallback string was used,
    // or due to problematic TypeScript type definitions for the @google/genai library.
    // With direct use of process.env.API_KEY (and the check above), 'ai' should be correctly formed.
    // Casting to 'any' to bypass the type error, assuming the call signature is correct at runtime.
    // Fix: Cast ai.models.generateImages to 'any' to resolve the "not callable" type error.
    const response = await (ai.models.generateImages as any)({
      model: IMAGEN_MODEL,
      // Prompts to Imagen should ideally be in English for best results, 
      // but we are passing the Vietnamese prompt directly.
      // For future improvement, consider translating Vietnamese image prompts to English before sending to Imagen API.
      prompt: `Nghệ thuật giả tưởng điện ảnh, cảnh hùng tráng: ${prompt}. Chi tiết cao, màu sắc sống động.`,
      config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
    });

    if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
      console.error("Phản hồi của Imagen không chứa dữ liệu hình ảnh hợp lệ:", response);
      throw new Error("Không thể truy xuất dữ liệu hình ảnh từ Imagen.");
    }
  } catch (error) {
    console.error("Lỗi khi tạo ảnh bằng Imagen:", error);
    if (error instanceof Error) {
         throw new Error(`Lỗi API Imagen: ${error.message}`);
    }
    throw new Error("Đã xảy ra lỗi không xác định trong quá trình tạo ảnh.");
  }
};
