import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api, { setAccessToken, clearAccessToken, getAccessToken } from '@frontend/app/lib/axios';
import { useAuth } from '@frontend/app/contexts/AuthContext';

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  userId: number;
}

export interface LoginResponse {
  accessToken: string;
}

export interface AuthError {
  message: string;
  statusCode?: number;
  error?: string;
}

const registerUser = async (data: RegisterRequest): Promise<RegisterResponse> => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

const logoutUser = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export const useRegister = (): UseMutationResult<RegisterResponse, AxiosError<AuthError>, RegisterRequest> => {
  return useMutation<RegisterResponse, AxiosError<AuthError>, RegisterRequest>({
    mutationFn: registerUser,
    onError: (error) => {
      console.error('Registration failed:', error?.response?.data?.message || error?.message);
    },
  });
};

export const useLogin = (): UseMutationResult<LoginResponse, AxiosError<AuthError>, LoginRequest> => {
  const { login } = useAuth();

  return useMutation<LoginResponse, AxiosError<AuthError>, LoginRequest>({
    mutationFn: loginUser,
    onSuccess: (data) => {
      // Store access token in memory (secure) and update auth context
      setAccessToken(data.accessToken);
      login(data.accessToken);
    },
    onError: (error) => {
      console.error('Login failed:', error.response?.data?.message || error.message);
    },
  });
};

export const useLogout = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // Continue with local logout even if API call fails
    } finally {
      clearAccessToken();
      logout();
    }
  };

  return { logout: handleLogout };
};

export const useAuthStatus = () => {
  const { isLoggedIn, isLoading } = useAuth();

  const isAuthenticated = () => {
    return isLoggedIn && getAccessToken() !== null;
  };

  return { isAuthenticated, isLoggedIn, isLoading };
};