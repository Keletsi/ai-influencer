// Shared types for the OpenRouter-only motion transfer studio

export interface GenerationSettings {
  motionStrength: number;
  matchMode: 'structure' | 'motion';
  quality: '720p' | '1080p';
  aspectRatio: '16:9' | '9:16' | '1:1';
  negativePrompt?: string;
  /** Free-form user instruction describing the shot they want. */
  prompt?: string;
}

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface MotionTransferResult {
  videoUrl: string;
  duration: number;
  creditsUsed?: number;
}

export interface UnifiedTaskResult {
  taskId: string;
  model: string;
  status: TaskStatus;
  progress: number;
  result?: MotionTransferResult;
  error?: string;
  createdAt: string;
  completedAt?: string;
  /** How the driver's motion reached the model, when known. */
  transferMode?: 'video-reference' | 'frame-reference';
}

export type ProgressCallback = (
  progress: number,
  status: TaskStatus,
  creditsUsed?: number
) => void | Promise<void>;