
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import type { ScenePayload } from '../types';

// Fix: Use process.env.API_KEY directly as per guidelines.
// The API_KEY check is handled within functions that use the 'ai' instance.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); 

const GEMINI_MODEL = 'gemini-2.5-flash-preview-04-17';

const modelConfig = {
  temperature: 0.75,
  topP: 0.95,
  topK: 40,
  responseMimeType: "application/json",
};

const systemInstruction = `Bạn là một AI quản trò trò chơi phiêu lưu văn bản chuyên nghiệp. Các phản hồi của bạn PHẢI ở định dạng JSON hợp lệ, bằng tiếng Việt, không có bất kỳ văn bản hay giải thích nào khác ngoài đối tượng JSON.
Hãy chú ý đến các quy tắc cú pháp JSON:
1.  Tên thuộc tính phải là chuỗi được đặt trong dấu ngoặc kép (ví dụ: "sceneText").
2.  Giá trị chuỗi phải được đặt hoàn toàn trong dấu ngoặc kép (ví dụ: "Đây là một chuỗi."). Tất cả nội dung của một chuỗi, bao gồm dấu cách và dấu câu, PHẢI nằm BÊN TRONG các dấu ngoặc kép này.
3.  Đảm bảo không có ký tự đặc biệt nào chưa được thoát (như dòng mới hoặc dấu ngoặc kép) tồn tại trong giá trị chuỗi. Nếu cần dấu ngoặc kép trong chuỗi, nó phải được thoát (ví dụ: "Anh ấy nói \\\\"Xin chào\\\\".").
4.  KHÔNG thêm bất kỳ văn bản hoặc ký tự nào sau giá trị chuỗi, trước dấu phẩy tiếp theo (nếu có nhiều thuộc tính hơn trong đối tượng/phần tử trong mảng) hoặc dấu ngoặc nhọn '}' / dấu ngoặc vuông ']'.
    Ví dụ JSON KHÔNG TỐT: { "key": "value" văn bản thừa sau giá trị, "key2": "value2" }
    Ví dụ JSON TỐT: { "key": "value", "key2": "value2" }

Kết quả JSON PHẢI tuân theo cấu trúc này (tất cả các giá trị chuỗi phải bằng tiếng Việt):
{
  "sceneText": "string (Mô tả tường thuật về cảnh hiện tại. Ví dụ: 'Một lối đi tăm tối trong rừng hiện ra trước mắt, bao phủ trong sương mù.')",
  "imagePrompt": "string (Gợi ý ngắn gọn để tạo hình ảnh, tối đa 15 từ. Ví dụ: 'Lối đi rừng tối mờ sương lúc chạng vạng')",
  "choices": [
    {
      "text": "string (Văn bản cho lựa chọn của người chơi. Ví dụ: 'Đi theo lối mòn vào rừng.')",
      "nextStepPrompt": "string (Tóm tắt hành động của người chơi, tối đa 10 từ. Ví dụ: 'Người chơi đi vào rừng'. Phải là một chuỗi JSON đơn, hoàn chỉnh.)"
    }
    // Cung cấp 2-3 đối tượng lựa chọn như vậy. Mỗi đối tượng lựa chọn phải là JSON hợp lệ.
  ],
  "gameOver": boolean (true nếu câu chuyện kết thúc, false nếu không),
  "gameWon": boolean (Tùy chọn: true nếu người chơi thắng, false nếu thua. Chỉ bao gồm nếu gameOver là true.)
}

Ví dụ về một đối tượng lựa chọn trong mảng "choices":
{
  "text": "Điều tra cây nấm phát sáng kỳ lạ bên cạnh cây cổ thụ",
  "nextStepPrompt": "Người chơi điều tra nấm phát sáng"
}

Đảm bảo tất cả các phần trong phản hồi của bạn, đặc biệt là các chuỗi cho 'sceneText', 'imagePrompt', 'text', và 'nextStepPrompt', là các chuỗi JSON được định dạng tốt và trích dẫn chính xác bằng tiếng Việt. Toàn bộ phản hồi phải là một đối tượng JSON hợp lệ duy nhất.`;

// Fix: Corrected syntax error in generic type parameter list (was <T,>, now <T>)
function parseGeminiJsonResponse<T>(responseText: string): T {
  let jsonStr = responseText.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  
  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    console.error("Không thể phân tích phản hồi JSON:", jsonStr, e);
    const jsonMatch = jsonStr.match(/({[\s\S]*})/);
    if (jsonMatch && jsonMatch[1]) {
        try {
            return JSON.parse(jsonMatch[1]) as T;
        } catch (e2) {
            console.error("Nỗ lực phân tích phụ không thành công:", jsonMatch[1], e2);
        }
    }
    throw new Error(`Phản hồi JSON không hợp lệ từ AI. Đã cố gắng phân tích: "${jsonStr.substring(0,1000)}"`);
  }
}

let chat: Chat | null = null;

const initializeChat = (): Chat => {
  if (!process.env.API_KEY) throw new Error("API Key của Gemini chưa được cấu hình.");
  return ai.chats.create({
    model: GEMINI_MODEL,
    config: {
      ...modelConfig,
      systemInstruction: systemInstruction,
    },
  });
};

export const startNewAdventure = async (): Promise<ScenePayload> => {
  if (!process.env.API_KEY) {
    console.error("Biến môi trường API_KEY chưa được đặt!");
    throw new Error("API Key của Gemini chưa được cấu hình.");
  }
  chat = initializeChat(); 

  const initialPrompt = `Bắt đầu một cuộc phiêu lưu mới bằng tiếng Việt trong một thế giới giả tưởng độc đáo (ví dụ: thành phố bay steampunk, vương quốc dưới nước đầy mê hoặc, hoặc ốc đảo sa mạc hậu tận thế). Mô tả cảnh ban đầu một cách sống động. Cung cấp 2-3 lựa chọn riêng biệt cho người chơi. Tuân thủ nghiêm ngặt cấu trúc JSON và các quy tắc cú pháp được chỉ định trong hướng dẫn hệ thống. Toàn bộ nội dung phải bằng tiếng Việt.`;
  
  try {
    const response: GenerateContentResponse = await chat.sendMessage({ message: initialPrompt });
    const parsedResponse = parseGeminiJsonResponse<ScenePayload>(response.text);
    if (!parsedResponse.choices || parsedResponse.choices.length === 0) {
        console.warn("AI không cung cấp lựa chọn nào. Buộc kết thúc trò chơi.");
        return { 
            ...parsedResponse, 
            sceneText: parsedResponse.sceneText + "\\n\\n(Con đường câu chuyện có vẻ không rõ ràng và không có lựa chọn nào được đưa ra.)",
            gameOver: true, 
            choices: [] 
        };
    }
    return parsedResponse;
  } catch (error) {
    console.error("Lỗi khi bắt đầu cuộc phiêu lưu mới:", error);
    if (error instanceof Error) {
         throw new Error(`Không thể bắt đầu cuộc phiêu lưu: ${error.message}`);
    }
    throw new Error("Đã xảy ra lỗi không xác định khi bắt đầu cuộc phiêu lưu.");
  }
};

export const progressAdventure = async (playerActionPrompt: string): Promise<ScenePayload> => {
  if (!process.env.API_KEY) {
    console.error("Biến môi trường API_KEY chưa được đặt!");
    throw new Error("API Key của Gemini chưa được cấu hình.");
  }
  if (!chat) {
    throw new Error("Phiên trò chuyện chưa được khởi tạo. Vui lòng bắt đầu một cuộc phiêu lưu mới trước.");
  }

  const continuationPrompt = `Người chơi đã chọn '${playerActionPrompt}'. Tiếp tục cuộc phiêu lưu dựa trên hành động này bằng tiếng Việt. Mô tả cảnh mới, cung cấp 2-3 lựa chọn mới và một gợi ý hình ảnh. Nếu câu chuyện kết thúc, đặt 'gameOver' thành true. Tuân thủ nghiêm ngặt cấu trúc JSON và các quy tắc cú pháp được chỉ định trong hướng dẫn hệ thống. Toàn bộ nội dung phải bằng tiếng Việt.`;

  try {
    const response: GenerateContentResponse = await chat.sendMessage({ message: continuationPrompt });
    const parsedResponse = parseGeminiJsonResponse<ScenePayload>(response.text);
     if (!parsedResponse.gameOver && (!parsedResponse.choices || parsedResponse.choices.length === 0)) {
        console.warn("AI không cung cấp lựa chọn cho trạng thái không kết thúc. Giả sử trò chơi kết thúc.");
        return { 
            ...parsedResponse, 
            sceneText: parsedResponse.sceneText + "\\n\\n(Câu chuyện dường như đã đi vào bế tắc vì không có lựa chọn nào khác được đưa ra.)",
            gameOver: true, 
            choices: [] 
        };
    }
    return parsedResponse;
  } catch (error) {
    console.error("Lỗi khi tiếp tục cuộc phiêu lưu:", error);
     if (error instanceof Error) {
         throw new Error(`Không thể tiếp tục cuộc phiêu lưu: ${error.message}`);
    }
    throw new Error("Đã xảy ra lỗi không xác định khi tiếp tục cuộc phiêu lưu.");
  }
};
