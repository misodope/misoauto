export interface PublishVideoPostJobData {
  videoPostId: number;
}

export interface PublishVideoPostJobResult {
  success: boolean;
  platformPostId?: string;
  postUrl?: string;
  error?: string;
}
