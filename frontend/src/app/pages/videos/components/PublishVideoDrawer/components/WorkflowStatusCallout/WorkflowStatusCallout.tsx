'use client';

import { Callout } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';

export type WorkflowState =
  | 'idle'
  | 'preparing'
  | 'processing'
  | 'ready'
  | 'publishing'
  | 'published'
  | 'error';

export interface WorkflowStatusCalloutProps {
  state: WorkflowState;
  message: string | null;
}

export default function WorkflowStatusCallout({
  state,
  message,
}: WorkflowStatusCalloutProps) {
  if (!message) return null;

  if (state === 'error') {
    return (
      <Callout.Root color="red">
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>{message}</Callout.Text>
      </Callout.Root>
    );
  }

  return (
    <Callout.Root color={state === 'ready' ? 'green' : 'blue'}>
      <Callout.Text>{message}</Callout.Text>
    </Callout.Root>
  );
}
