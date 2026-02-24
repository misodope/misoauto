import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '@frontend/app/lib/axios';

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phoneNumber?: string;
  smsConsent?: boolean;
  emailConsent?: boolean;
}

export interface UpdateProfileResponse {
  id: number;
  email: string;
  name: string | null;
  phoneNumber: string | null;
  smsConsent: boolean;
  emailConsent: boolean;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface OptOutRequest {
  smsConsent?: boolean;
  emailConsent?: boolean;
}

export interface UsersApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

const updateProfile = async (
  data: UpdateProfileRequest,
): Promise<UpdateProfileResponse> => {
  const response = await api.patch('/users/me', data);
  return response.data;
};

const updatePassword = async (data: UpdatePasswordRequest): Promise<void> => {
  await api.patch('/users/me/password', data);
};

const optOut = async (data: OptOutRequest): Promise<void> => {
  await api.patch('/users/me/opt-out', data);
};

export const useUpdateProfile = (): UseMutationResult<
  UpdateProfileResponse,
  AxiosError<UsersApiError>,
  UpdateProfileRequest
> => {
  return useMutation({
    mutationFn: updateProfile,
    onError: (error) => {
      console.error(
        'Failed to update profile:',
        error.response?.data?.message || error.message,
      );
    },
  });
};

export const useUpdatePassword = (): UseMutationResult<
  void,
  AxiosError<UsersApiError>,
  UpdatePasswordRequest
> => {
  return useMutation({
    mutationFn: updatePassword,
    onError: (error) => {
      console.error(
        'Failed to update password:',
        error.response?.data?.message || error.message,
      );
    },
  });
};

export const useOptOut = (): UseMutationResult<
  void,
  AxiosError<UsersApiError>,
  OptOutRequest
> => {
  return useMutation({
    mutationFn: optOut,
    onError: (error) => {
      console.error(
        'Failed to update opt-out preferences:',
        error.response?.data?.message || error.message,
      );
    },
  });
};
