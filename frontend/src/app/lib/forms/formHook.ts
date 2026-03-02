'use client';

import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from './contexts';
import { FormTextField } from './fields/FormTextField';

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField: FormTextField,
  },
  formComponents: {},
});
