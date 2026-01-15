
import React, { useState, useRef } from 'react';
import { splitScriptIntoVoiceSegments } from './services/geminiService';
import { Scene, VideoStyle, STYLE_OPTIONS } from './types';

const App: React.FC = () => {
  const [inputScript, setInputScript] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<VideoStyle>('motion_graphics');
  const [language, setLanguage] = useState('English');
  const [mode, setMode] = useState<'ai' | 'manual'>('manual');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const isAborting = useRef(false);

  // Tính số lượng từ cho kịch bản gốc
  const wordCount = inputScript.trim() ? inputScript.trim().split(/\s+/).length : 0;

  // Logic tạo prompt cục bộ dựa trên Template
  const generateLocalPrompt = (voiceText: string, style: VideoStyle): string => {
    const templates: Record<VideoStyle, string> = {
      motion_graphics: "2D Vector Motion Graphics, clean flat design, minimal aesthetic, fluid animation, high contrast colors. Scene showing: ",
      cinematic: "Cinematic 8k video, highly detailed, photorealistic, dramatic movie lighting, depth of field, professional cinematography. Scene: ",
      anime: "Studio Ghibli style anime, hand-drawn art, vibrant whimsical colors, nostalgic atmosphere, detailed backgrounds. Scene: ",
      '3d': "3D animation Pixar style, smooth textures, expressive characters, high-end rendering, soft global illumination. Scene: ",
      cyberpunk: "Cyberpunk neon aesthetic, futuristic city, rainy night, high contrast, pink and blue lighting, volumetric fog. Scene: ",
      vintage: "Vintage 1950s film style, black and white, film grain, nostalgic cinematography, classic lens flare. Scene: ",
      documentary: "National Geographic documentary style, ultra-realistic, professional wildlife cinematography, natural lighting. Scene: ",
      handdrawn: "Artist hand-drawn sketch, pencil and charcoal texture, rough storyboard aesthetic, creative charcoal motion. Scene: "
    };

    const prefix = templates[style] || "High quality professional video, 8k, detailed. Scene showing: ";
    return `${prefix}${voiceText}`;
  };

  // Hàm chia kịch bản thủ công
  const splitScriptLocally = (text: string): { id: number; voiceText: string }[] => {
    const words = text.trim().split(/\s+/);
    const wordsPerSegment = language === 'Vietnamese' ? 22 : 28; 
    const segments = [];
    
    for (let i = 0; i < words.length; i += wordsPerSegment) {
      const segmentWords = words.slice(i, i + wordsPerSegment);
      segments.push({
        id: Math.floor(i / wordsPerSegment) + 1,
        voiceText: segmentWords.join(' ')
      });
    }
    return segments;
  };

  const handleStop = () => {
    isAborting.current = true;
    setIsLoading(false);
    setProgress(0);
  };

  const handleClearText = () => {
    setInputScript('');
  };

  const handleResetAll = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ kịch bản và các phân cảnh đã tạo?")) {
      setInputScript('');
      setScenes([]);
      setProgress(0);
      setError(null);
    }
  };

  const handleProcess = async () => {
    if (!inputScript.trim()) {
      alert("Vui lòng nhập kịch bản!");
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setError(null);
    setScenes([]);
    isAborting.current = false;

    try {
      let segments: { id: number; voiceText: string }[] = [];

      if (mode === 'ai') {
        setProgress(20);
        segments = await splitScriptIntoVoiceSegments(inputScript, language);
      } else {
        segments = splitScriptLocally(inputScript);
      }

      if (isAborting.current) return;
      
      const results: Scene[] = [];
      const totalSteps = segments.length;

      for (let i = 0; i < segments.length; i++) {
        if (isAborting.current) break;

        const seg = segments[i];
        const prompt = generateLocalPrompt(seg.voiceText, selectedStyle);
        
        const startTime = i * 8;
        const endTime = (i + 1) * 8;
        const formatTime = (s: number) => {
          const mins = Math.floor(s / 60).toString().padStart(2, '0');
          const secs = (s % 60).toString().padStart(2, '0');
          return `${mins}:${secs}`;
        };

        results.push({
          id: i + 1,
          timeRange: `${formatTime(startTime)} - ${formatTime(endTime)}`,
          voiceText: seg.voiceText,
          videoPrompt: prompt
        });

        const currentProgress = mode === 'ai' 
          ? 20 + Math.round(((i + 1) / totalSteps) * 80)
          : Math.round(((i + 1) / totalSteps) * 100);
          
        setProgress(currentProgress);
        setScenes([...results]);
      }

    } catch (err: any) {
      console.error(err);
      setError("Có lỗi khi phân đoạn kịch bản. Vui lòng thử chế độ THỦ CÔNG nếu không có API Key.");
    } finally {
      if (!isAborting.current) {
        setIsLoading(false);
      }
    }
  };

  const updatePromptValue = (id: number, newValue: string) => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, videoPrompt: newValue } : s));
  };

  const downloadFile = (type: 'voice' | 'prompt') => {
    if (scenes.length === 0) return;

    let content = "";
    if (type === 'voice') {
      content = scenes.map(s => s.voiceText.trim()).join('\r\n');
    } else {
      content = scenes.map(s => s.videoPrompt.trim()).join('\r\n');
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type === 'voice' ? 'Voice_Only' : 'Prompt_Only'}_Veo3.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 p-4 md:p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-10">
        
        <header className="text-center space-y-3 pt-6">
          <div className="inline-block px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-bold text-emerald-400 tracking-widest uppercase mb-2">
            Professional Studio Tool
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            VEO3 <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">PRO</span> EDITOR
          </h1>
          <p className="text-slate-500 text-lg font-medium">Phân cảnh 8 giây & Tạo Prompt Visual chất lượng cao.</p>
        </header>

        <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-slate-800 p-6 md:p-10 space-y-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <label className="flex items-center space-x-3 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
              <span className="w-8 h-8 flex items-center justify-center bg-emerald-600 text-white rounded-xl shadow-lg">1</span>
              <span>Nội dung kịch bản gốc</span>
            </label>
            
            <div className="flex items-center space-x-3">
               <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
                <button 
                  onClick={() => setMode('ai')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${mode === 'ai' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  AI
                </button>
                <button 
                  onClick={() => setMode('manual')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${mode === 'manual' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  MANUAL
                </button>
              </div>
              
              <div className="h-8 w-[1px] bg-slate-800 mx-1 hidden md:block"></div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={handleClearText}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase transition-all border border-slate-700 active:scale-95"
                  title="Chỉ xóa văn bản"
                >
                  Xóa Text
                </button>
                <button 
                  onClick={handleResetAll}
                  className="px-4 py-2 bg-red-950/30 hover:bg-red-900/40 text-red-400 rounded-xl text-[10px] font-black uppercase transition-all border border-red-900/30 active:scale-95"
                  title="Xóa toàn bộ kịch bản và kết quả"
                >
                  Xóa Tất Cả
                </button>
              </div>
            </div>
          </div>

          <div className="relative">
            <textarea
              className="w-full h-56 p-6 bg-slate-950 border border-slate-800 rounded-3xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-100 placeholder-slate-700 outline-none resize-none leading-relaxed text-lg shadow-inner"
              placeholder="Nhập nội dung kịch bản tại đây..."
              value={inputScript}
              onChange={(e) => setInputScript(e.target.value)}
              disabled={isLoading}
            />
            <div className="absolute bottom-4 right-6 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              <span className="text-emerald-400 font-bold">{wordCount}</span> từ
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Ngôn ngữ kịch bản</label>
              <select
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 outline-none cursor-pointer hover:border-slate-700 transition-colors"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={isLoading}
              >
                <option value="English">Tiếng Anh</option>
                <option value="Vietnamese">Tiếng Việt</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Phong cách Visual</label>
              <select
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 outline-none cursor-pointer hover:border-slate-700 transition-colors"
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value as VideoStyle)}
                disabled={isLoading}
              >
                {STYLE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              {!isLoading ? (
                <button
                  onClick={handleProcess}
                  className="w-full h-[3.75rem] bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black text-white transition-all transform active:scale-[0.98] shadow-xl flex items-center justify-center space-x-3"
                >
                  <span className="text-lg uppercase">⚡ PHÂN CẢNH TỨC THÌ</span>
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="w-full h-[3.75rem] bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 rounded-2xl font-black text-red-500 transition-all flex items-center justify-center space-x-3"
                >
                  <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>
                  <span>DỪNG LẠI</span>
                </button>
              )}
            </div>
          </div>

          {isLoading && (
            <div className="pt-6 border-t border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-500 tracking-widest">
                <span className="uppercase">{mode === 'ai' ? 'Đang dùng AI phân đoạn...' : 'Đang xử lý kịch bản...'}</span>
                <span className="text-white">{progress}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.6)]" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {scenes.length > 0 && (
          <div className="space-y-6 pb-32 animate-in slide-in-from-bottom-10 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-800 gap-6">
              <div className="flex items-center space-x-5">
                <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">{scenes.length} Phân cảnh</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Đã tối ưu lời thoại 8 giây/cảnh</p>
                </div>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <button onClick={() => downloadFile('voice')} className="flex-1 md:flex-none px-8 py-3.5 bg-slate-800 text-xs font-black rounded-xl hover:bg-slate-750 transition-all border border-slate-700 shadow-xl uppercase">Tải Voice</button>
                <button onClick={() => downloadFile('prompt')} className="flex-1 md:flex-none px-8 py-3.5 bg-emerald-600 text-xs font-black rounded-xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 uppercase">Tải Prompt</button>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-sm">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-slate-800">
                    <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase text-center w-24">Phân cảnh</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase w-48">Timeline (8s)</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase w-1/3">Nội dung thoại</th>
                    <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase">Visual Prompt (Sửa trực tiếp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {scenes.map((scene) => (
                    <tr key={scene.id} className="hover:bg-white/[0.02] transition-all group">
                      <td className="px-6 py-10 text-center">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <span className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400 font-black text-xl shadow-inner group-hover:border-emerald-500/50 transition-colors">
                            {scene.id}
                          </span>
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">SCENE</span>
                        </div>
                      </td>
                      <td className="px-6 py-10">
                        <div className="flex flex-col space-y-2">
                          <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 shadow-inner group-hover:border-indigo-500/30 transition-colors">
                            <span className="text-sm font-black font-mono text-indigo-400 block tracking-wider">
                              {scene.timeRange}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5 pl-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Duration: 08s</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-10 text-sm md:text-base text-slate-300 leading-relaxed font-medium italic">
                        "{scene.voiceText}"
                      </td>
                      <td className="px-6 py-10">
                        <div className="relative group/field">
                          <textarea
                            className="w-full min-h-[120px] p-5 bg-slate-950 border border-slate-800 rounded-3xl text-[11px] font-mono text-emerald-400/80 outline-none focus:border-emerald-500/50 focus:ring-8 focus:ring-emerald-500/5 transition-all resize-y leading-relaxed shadow-inner"
                            value={scene.videoPrompt}
                            onChange={(e) => updatePromptValue(scene.id, e.target.value)}
                            placeholder="Mô tả visual chi tiết cho cảnh này..."
                          />
                          <div className="absolute top-4 right-4 opacity-0 group-hover/field:opacity-100 transition-all">
                             <button 
                               onClick={() => {
                                 navigator.clipboard.writeText(scene.videoPrompt);
                                 alert(`Đã copy prompt cảnh ${scene.id}`);
                               }}
                               className="p-2.5 bg-slate-800 hover:bg-emerald-600 rounded-xl text-slate-400 hover:text-white shadow-2xl border border-slate-700 active:scale-90 transition-all"
                               title="Sao chép Prompt"
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                             </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
