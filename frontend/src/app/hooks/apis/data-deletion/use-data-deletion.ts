import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '@frontend/app/lib/axios';

export type DataDeletionStatusValue = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface DataDeletionStatus {
  confirmationCode: string;
  platform: 'INSTAGRAM';
  status: DataDeletionStatusValue;
  dataFound: boolean;
  requestedAt: string;
  completedAt: string | null;
}

export interface DataDeletionApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

export const getDataDeletionStatus = async (
  code: string,
): Promise<DataDeletionStatus> => {
  const response = await api.get<DataDeletionStatus>(`/data-deletion/${code}`);
  return response.data;
};

export const dataDeletionKeys = {
  all: ['data-deletion'] as const,
  status: (code: string) => [...dataDeletionKeys.all, code] as const,
};

export const useDataDeletionStatus = (
  code: string,
): UseQueryResult<DataDeletionStatus, AxiosError<DataDeletionApiError>> => {
  return useQuery({
    queryKey: dataDeletionKeys.status(code),
    queryFn: () => getDataDeletionStatus(code),
    enabled: Boolean(code),
    retry: (failureCount, error) => {
      if (error.response?.status === 404) {
        return false;
      }
      return failureCount < 1;
    },
  });
};
