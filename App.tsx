
import React, { useState, useEffect, useCallback } from 'react';
import type { CurrentScene, Choice } from './types';
import { startNewAdventure, progressAdventure } from './services/geminiService';
import { generateAdventureImage } from './services/imagenService';
import Header from './components/Header';
import StoryDisplay from './components/StoryDisplay';
import ChoiceButton from './components/ChoiceButton';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
  const [currentScene, setCurrentScene] = useState<CurrentScene | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState<boolean>(false);

  useEffect(() => {
    if (!process.env.API_KEY) {
      setError("API_KEY chưa được cấu hình. Vui lòng đặt biến môi trường API_KEY.");
      setIsApiKeyMissing(true);
    }
  }, []);

  const fetchImage = useCallback(async (imagePrompt: string) => {
    if (!imagePrompt) {
        setCurrentImageUrl("https://picsum.photos/seed/no_prompt_fallback_vi/800/600"); 
        return;
    }
    try {
      const imageUrl = await generateAdventureImage(imagePrompt);
      setCurrentImageUrl(imageUrl);
    } catch (e) {
      console.error("Tạo ảnh thất bại:", e);
      setError(e instanceof Error ? e.message : "Không thể tạo hình ảnh.");
      setCurrentImageUrl("https://picsum.photos/seed/error_vi/800/600"); 
    }
  }, []);

  const handleStartGame = useCallback(async () => {
    if (isApiKeyMissing) return;
    setIsLoading(true);
    setError(null);
    setCurrentImageUrl(null); 
    setCurrentScene(null);

    try {
      const initialScene = await startNewAdventure();
      setCurrentScene(initialScene);
      setGameStarted(true);
      if (initialScene.imagePrompt) {
        await fetchImage(initialScene.imagePrompt);
      } else {
        setCurrentImageUrl("https://picsum.photos/seed/no_prompt_initial_vi/800/600");
      }
    } catch (e) {
      console.error("Không thể bắt đầu trò chơi:", e);
      setError(e instanceof Error ? e.message : "Không thể bắt đầu cuộc phiêu lưu.");
      setGameStarted(false);
    } finally {
      setIsLoading(false);
    }
  }, [fetchImage, isApiKeyMissing]);

  const handleChoice = useCallback(async (selectedChoice: Choice) => {
    if (isApiKeyMissing || !currentScene || currentScene.gameOver) return;

    setIsLoading(true);
    setError(null);

    try {
      const nextScene = await progressAdventure(selectedChoice.nextStepPrompt);
      setCurrentScene(nextScene);
      if (!nextScene.gameOver && nextScene.imagePrompt) {
        await fetchImage(nextScene.imagePrompt);
      } else if (nextScene.gameOver && nextScene.imagePrompt) {
        await fetchImage(nextScene.imagePrompt);
      } else if (!nextScene.imagePrompt) {
         setCurrentImageUrl("https://picsum.photos/seed/no_prompt_choice_vi/800/600");
      }
    } catch (e) {
      console.error("Không thể xử lý lựa chọn:", e);
      setError(e instanceof Error ? e.message : "Đã xảy ra lỗi khi tiếp tục câu chuyện.");
    } finally {
      setIsLoading(false);
    }
  }, [currentScene, fetchImage, isApiKeyMissing]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100 flex flex-col items-center p-4 sm:p-6 font-[system-ui,sans-serif]">
      <Header />

      {isApiKeyMissing && (
         <div className="my-10 p-6 bg-red-800/50 border border-red-700 rounded-lg text-center max-w-md">
            <h2 className="text-2xl font-bold text-red-300 mb-2">Thiếu API Key</h2>
            <p className="text-red-200">Ứng dụng này yêu cầu một API key của Google Gemini. Vui lòng đảm bảo biến môi trường <code>API_KEY</code> được thiết lập chính xác.</p>
        </div>
      )}

      {isLoading && <LoadingSpinner />}
      
      {error && !isLoading && (
        <div className="my-6 p-4 bg-red-700/40 border border-red-600 rounded-lg text-center max-w-lg">
          <h3 className="text-xl font-semibold text-red-300 mb-2">Đã xảy ra lỗi</h3>
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {!gameStarted && !isLoading && !isApiKeyMissing && (
        <div className="text-center my-10">
          <p className="text-xl text-slate-300 mb-8 max-w-xl mx-auto">
            Bước vào một cuộc hành trình không thể đoán trước, nơi lựa chọn của bạn định hình câu chuyện và AI mang từng cảnh vật trở nên sống động!
          </p>
          <button
            onClick={handleStartGame}
            className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold py-4 px-10 rounded-lg shadow-xl hover:shadow-sky-500/40 transform hover:scale-105 transition-all duration-200 ease-in-out text-xl focus:outline-none focus:ring-4 focus:ring-sky-400 focus:ring-opacity-75"
          >
            Bắt đầu cuộc phiêu lưu
          </button>
        </div>
      )}

      {gameStarted && currentScene && !isLoading && (
        <main className="w-full flex flex-col items-center">
          <StoryDisplay 
            sceneText={currentScene.sceneText} 
            imageUrl={currentImageUrl} 
            imageAltText={currentScene.imagePrompt || "Cảnh phiêu lưu"}
          />

          {!currentScene.gameOver && currentScene.choices && currentScene.choices.length > 0 && (
            <div className="mt-6 sm:mt-8 w-full max-w-md">
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-6 text-sky-300 tracking-wide">CHỌN CON ĐƯỜNG CỦA BẠN</h2>
              {currentScene.choices.map((choice, index) => (
                <ChoiceButton 
                  key={index} 
                  onClick={() => handleChoice(choice)}
                  disabled={isLoading}
                >
                  {choice.text}
                </ChoiceButton>
              ))}
            </div>
          )}

          {currentScene.gameOver && (
            <div className="mt-8 text-center p-6 bg-slate-800 rounded-xl shadow-2xl max-w-md">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
                {currentScene.gameWon ? "CHIẾN THẮNG!" : "TRÒ CHƠI KẾT THÚC"}
              </h2>
              <p className="text-slate-300 mb-6 text-lg">{currentScene.gameWon === false ? "Hành trình của bạn kết thúc tại đây." : currentScene.gameWon === true ? "Bạn đã chiến thắng!" : "Cuộc phiêu lưu đã khép lại."}</p>
              <button
                onClick={handleStartGame}
                className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-3 px-8 rounded-lg shadow-xl hover:shadow-green-500/40 transform hover:scale-105 transition-all duration-200 ease-in-out text-lg focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-opacity-75"
              >
                Chơi lại?
              </button>
            </div>
          )}
        </main>
      )}
    </div>
  );
};

export default App;