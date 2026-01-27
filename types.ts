
export interface Scene {
  id: number;
  timeRange: string;
  voiceText: string;
  videoPrompt: string;
}

export type VideoStyle = 
  | 'vector_motion'
  | 'motion_graphics' 
  | 'cinematic' 
  | '3d_animation' 
  | 'realistic' 
  | 'anime' 
  | 'cyberpunk';

export const STYLE_OPTIONS: { value: VideoStyle; label: string }[] = [
  { value: 'vector_motion', label: '2D Vector Motion Graphics' },
  { value: 'motion_graphics', label: 'Motion Graphics' },
  { value: 'cinematic', label: 'Cinematic Movie' },
  { value: '3d_animation', label: '3D Animation' },
  { value: 'realistic', label: 'Hyper Realistic' },
  { value: 'anime', label: 'Anime Style' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
];
