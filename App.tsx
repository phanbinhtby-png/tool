
import React, { useState } from 'react';
import { Scene, VideoStyle, STYLE_OPTIONS } from './types';

const App: React.FC = () => {
  const [inputScript, setInputScript] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<VideoStyle>('vector_motion');
  const [language, setLanguage] = useState('Vietnamese');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wordCount = inputScript.trim() ? inputScript.trim().split(/\s+/).length : 0;

  // Thuật toán tạo Prompt Visual dựa trên Style mà không cần AI
  const getPromptTemplate = (text: string, style: VideoStyle) => {
    const baseKeywords = "high quality, smooth animation, masterwork, 24fps, clean composition";
    const stylesMap: Record<VideoStyle, string> = {
      'vector_motion': "2D vector motion graphics, flat design aesthetic, clean solid shapes, Adobe Illustrator style, minimalist vector art, bold colors, crisp outlines, smooth geometric transitions",
      'motion_graphics': "motion graphics style, clean shapes, vibrant colors, flat design, smooth animation, kinetic typography elements",
      'cinematic': "cinematic movie style, shallow depth of field, anamorphic lens flares, dramatic atmosphere, 8k resolution, cinematic lighting",
      '3d_animation': "unreal engine 5 render, pixar style 3d, stylized characters, soft shadows, raytraced reflections",
      'realistic': "photorealistic, shot on 35mm lens, national geographic style, natural textures, hyper-detailed",
      'anime': "modern anime style, makoto shinkai aesthetic, vibrant sky, hand-drawn lines, cel shaded",
      'cyberpunk': "cyberpunk aesthetic, neon lights, rainy night, futuristic city, glow and bloom, synthwave palette"
    };

    return `${stylesMap[style]}. Visual description: ${text}. ${baseKeywords}`;
  };

  const handleProcess = () => {
    if (!inputScript.trim()) {
      alert("Vui lòng nhập kịch bản!");
      return;
    }

    setError(null);
    const words = inputScript.trim().split(/\s+/);
    const wordsPerSegment = language === 'Vietnamese' ? 22 : 28;
    const results: Scene[] = [];

    // Chia đoạn tức thì
    for (let i = 0, sceneIdx = 0; i < words.length; i += wordsPerSegment, sceneIdx++) {
      const segmentText = words.slice(i, i + wordsPerSegment).join(' ');
      
      const startTime = sceneIdx * 8;
      const endTime = (sceneIdx + 1) * 8;
      const formatTime = (s: number) => {
        const mins = Math.floor(s / 60).toString().padStart(2, '0');
        const secs = (s % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
      };

      results.push({
        id: sceneIdx + 1,
        timeRange: `${formatTime(startTime)} - ${formatTime(endTime)}`,
        voiceText: segmentText,
        videoPrompt: getPromptTemplate(segmentText, selectedStyle)
      });
    }

    setScenes(results);
  };

  const downloadFile = (type: 'voice' | 'prompt') => {
    if (scenes.length === 0) return;
    const content = type === 'voice' 
      ? scenes.map(s => s.voiceText.trim()).join('\r\n')
      : scenes.map(s => s.videoPrompt.trim()).join('\r\n');
      
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type === 'voice' ? 'Voice_Script' : 'Video_Prompts'}_Offline.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-10">
        
        <header className="text-center space-y-4 pt-10">
          <div className="flex justify-center">
             <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-400 tracking-widest uppercase flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
                Local Engine Active (No API Needed)
             </div>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic leading-none">
            VEO3 <span className="text-indigo-500">FAST</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto">Hệ thống phân cảnh và tạo Prompt tức thì cho 2D Motion & Cinematic.</p>
        </header>

        <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-white/5 p-6 md:p-12 space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <span className="w-12 h-12 flex items-center justify-center bg-white text-black rounded-2xl font-black text-xl italic shadow-xl">1</span>
              <div>
                <h2 className="text-xl font-black text-white uppercase italic">Kịch bản gốc</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Dán nội dung từ Chat GPT hoặc file của bạn</p>
              </div>
            </div>
            
            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
              <div className="px-6 py-2 rounded-xl text-[10px] font-black bg-white/5 text-slate-400 uppercase tracking-widest border border-white/5">CHẾ ĐỘ TỨC THÌ</div>
            </div>
          </div>

          <div className="relative group">
            <textarea
              className="w-full h-72 p-8 bg-black/40 border border-white/5 rounded-[2rem] focus:border-indigo-500/50 transition-all text-slate-100 placeholder-slate-800 outline-none resize-none leading-relaxed text-xl shadow-inner group-hover:border-white/10"
              placeholder="Dán kịch bản video của bạn tại đây để phân đoạn tự động 8 giây..."
              value={inputScript}
              onChange={(e) => setInputScript(e.target.value)}
            />
            <div className="absolute bottom-6 right-8 text-[10px] font-black tracking-widest text-slate-600 bg-black/60 px-4 py-2 rounded-full border border-white/5">
              {wordCount.toLocaleString()} WORDS
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Ngôn ngữ kịch bản</label>
              <select className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-slate-200 outline-none cursor-pointer focus:border-indigo-500/30 transition-all font-bold appearance-none shadow-xl" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="English">English (28 words/8s)</option>
                <option value="Vietnamese">Tiếng Việt (22 từ/8s)</option>
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Phong cách Visual</label>
              <select className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-slate-200 outline-none cursor-pointer focus:border-indigo-500/30 transition-all font-bold appearance-none shadow-xl" value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value as VideoStyle)}>
                {STYLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button 
                onClick={handleProcess} 
                className="w-full h-[4.5rem] bg-white text-black hover:bg-indigo-500 hover:text-white rounded-[1.5rem] font-black transition-all shadow-[0_20px_40px_-15px_rgba(255,255,255,0.1)] uppercase italic tracking-tighter flex items-center justify-center gap-3 active:scale-95 text-lg"
              >
                <span>⚡ PHÂN CẢNH NGAY</span>
              </button>
            </div>
          </div>
        </div>

        {scenes.length > 0 && (
          <div className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-center bg-indigo-600 p-10 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(79,70,229,0.3)] gap-8">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/30">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">{scenes.length} SCENES GENERATED</h3>
                  <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.3em]">Xử lý hoàn tất trong 0.01 giây</p>
                </div>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <button onClick={() => downloadFile('voice')} className="flex-1 md:flex-none px-10 py-4 bg-black/20 text-white text-[10px] font-black rounded-xl hover:bg-black/30 transition-all uppercase border border-white/20 tracking-widest shadow-xl">Tải Voice</button>
                <button onClick={() => downloadFile('prompt')} className="flex-1 md:flex-none px-10 py-4 bg-white text-indigo-600 text-[10px] font-black rounded-xl hover:bg-indigo-50 transition-all shadow-2xl uppercase tracking-widest border border-white">Tải Prompt</button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {scenes.map((scene) => (
                <div key={scene.id} className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] hover:border-indigo-500/30 transition-all flex flex-col md:flex-row gap-8 group">
                  <div className="flex flex-col items-center justify-center md:w-32 gap-3">
                    <span className="text-5xl font-black text-white/5 italic group-hover:text-indigo-500/20 transition-colors leading-none">{scene.id.toString().padStart(2, '0')}</span>
                    <span className="text-[10px] font-black font-mono text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20">{scene.timeRange}</span>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Voiceover Segment</label>
                      <p className="text-slate-300 italic text-lg leading-relaxed">"{scene.voiceText}"</p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                     <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Veo3 Visual Prompt</label>
                     <textarea
                        className="w-full p-5 bg-black/60 border border-white/5 rounded-2xl text-[11px] font-mono text-indigo-300 leading-relaxed focus:border-indigo-500/40 outline-none transition-all resize-none shadow-inner"
                        rows={3}
                        value={scene.videoPrompt}
                        onChange={(e) => {
                           const newScenes = [...scenes];
                           newScenes[scene.id-1].videoPrompt = e.target.value;
                           setScenes(newScenes);
                        }}
                      />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <footer className="mt-32 py-16 opacity-30 text-center space-y-4">
        <div className="flex justify-center gap-8 text-slate-500 font-black text-[9px] uppercase tracking-[0.4em]">
           <span>NO-API ENGINE</span>
           <span>•</span>
           <span>VEO3 COMPATIBLE</span>
           <span>•</span>
           <span>LOCAL STORAGE</span>
        </div>
        <p className="font-black text-[10px] uppercase tracking-[1em] text-slate-600">PHAN BÌNH STUDIO - PRO EDITION</p>
      </footer>
    </div>
  );
};

export default App;
