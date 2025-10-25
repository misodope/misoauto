import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import api from '../../lib/axios';

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
  access_token: string;
}

export interface AuthError {
  message: string;
  statusCode?: number;
  error?: string;
}

const registerUser = async (data: RegisterRequest): Promise<RegisterResponse> => {
  console.log('registerUser', data);
  const response = await api.post('/auth/register', data);
  return response.data;
};

const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

export const useRegister = (): UseMutationResult<RegisterResponse, AxiosError<AuthError>, RegisterRequest> => {
  return useMutation<RegisterResponse, AxiosError<AuthError>, RegisterRequest>({
    mutationFn: registerUser,
    onSuccess: (data) => {

      console.log('Registration successful:', data.message);
    },
    onError: (error) => {

      console.log('Registration error:', JSON.stringify(error));
      console.error('Registration failed:', error?.response?.data?.message || error?.message);
    },
  });
};

export const useLogin = (): UseMutationResult<LoginResponse, AxiosError<AuthError>, LoginRequest> => {
  return useMutation<LoginResponse, AxiosError<AuthError>, LoginRequest>({
    mutationFn: loginUser,
    onSuccess: (data) => {

      console.log('Login successful:', data);
      const token = Cookies.get('access_token');
      console.log('JWT Token:', token);

      Cookies.set('accessToken', data.access_token, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      console.log('Login successful');
    },
    onError: (error) => {

      console.error('Login failed:', error.response?.data?.message || error.message);
    },
  });
};

export const useLogout = () => {
  const logout = () => {

    Cookies.remove('access_token');

    console.log('Logged out successfully');
  };

  return { logout };
};

export const useAuthStatus = () => {
  const isAuthenticated = () => {
    const token = Cookies.get('access_token');
    return !!token;
  };

  const getToken = () => {
    return Cookies.get('access_token');
  };

  return { isAuthenticated, getToken };
};