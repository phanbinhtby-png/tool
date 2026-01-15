
export interface Scene {
  id: number;
  timeRange: string;
  voiceText: string;
  videoPrompt: string;
}

export type VideoStyle = 
  | 'motion_graphics'
  | 'cinematic' 
  | 'anime' 
  | '3d' 
  | 'cyberpunk' 
  | 'vintage' 
  | 'documentary' 
  | 'handdrawn';

export interface StyleOption {
  value: VideoStyle;
  label: string;
  description: string;
}

export const STYLE_OPTIONS: StyleOption[] = [
  { value: 'motion_graphics', label: '2D Vector Motion Graphics', description: 'Đồ họa chuyển động vector phẳng, tối giản, màu sắc hiện đại và mượt mà' },
  { value: 'cinematic', label: 'Điện ảnh Siêu thực', description: 'Chất lượng 8k, IMAX, ánh sáng kịch tính, độ sâu trường ảnh tốt' },
  { value: 'anime', label: 'Anime Studio Ghibli', description: 'Màu sắc rực rỡ, nét vẽ tay nghệ thuật, cảm giác hoài cổ' },
  { value: '3d', label: 'Hoạt hình 3D Pixar/Disney', description: 'Biểu cảm cao, đổ bóng mượt mà, phong cách dễ thương' },
  { value: 'cyberpunk', label: 'Cyberpunk Neon', description: 'Tương lai, độ tương phản cao, ánh sáng neon, đường phố mưa đêm' },
  { value: 'vintage', label: 'Phim Cổ điển', description: 'Có hạt nhiễu film, đen trắng, phong cách những năm 1950' },
  { value: 'documentary', label: 'Phim Tài liệu (National Geographic)', description: 'Siêu thực tế, quay cận cảnh thiên nhiên, độ nét cao' },
  { value: 'handdrawn', label: 'Bản vẽ phác thảo tay', description: 'Nghệ thuật, các nét vẽ thô, phong cách storyboard' },
];
