'use client';

import { TextField, Text, Box } from '@radix-ui/themes';
import { useFieldContext } from '../contexts';

export interface FormTextFieldProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number';
  placeholder?: string;
  size?: '1' | '2' | '3';
  disabled?: boolean;
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

export function FormTextField({
  label,
  type = 'text',
  placeholder,
  size = '3',
  disabled,
}: FormTextFieldProps) {
  const field = useFieldContext<string>();
  const errors = field.state.meta.errors;
  const hasError = errors.length > 0;

  return (
    <Box>
      <Box mb="1">
        <Text as="label" htmlFor={field.name} size="2" weight="medium">
          {label}
        </Text>
      </Box>
      <TextField.Root
        id={field.name}
        type={type}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        placeholder={placeholder}
        size={size}
        disabled={disabled}
        color={hasError ? 'red' : undefined}
      />
      {hasError && (
        <Box mt="1">
          <Text size="1" color="red">
            {errors.map(getErrorMessage).join(', ')}
          </Text>
        </Box>
      )}
    </Box>
  );
}
