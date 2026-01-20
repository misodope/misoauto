import api from '@frontend/app/lib/axios';
import { useMutation } from '@tanstack/react-query';

const connectTikTok = async () => {
  const response = await api.get('/platform/tiktok/oauth');
  return response.data;
}

export const useTikTokIntegration = () => {
  return useMutation({
    mutationFn: connectTikTok,
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error(`Error connecting TikTok account: ${error.message}`)
    }
  })
}