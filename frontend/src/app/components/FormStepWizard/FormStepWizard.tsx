'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import styles from './FormStepWizard.module.scss';

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
  canContinue?: boolean;
}

export interface FormStepWizardProps {
  config: FormStep[];
  orientation?: 'vertical' | 'horizontal';
  resetKey?: string | number;
  isSubmitting?: boolean;
  cancelLabel?: string;
  submitLabel?: string;
  onCancel?: () => void;
  onSubmit: () => void | Promise<void>;
}

export default function FormStepWizard({
  config,
  orientation = 'vertical',
  resetKey,
  isSubmitting = false,
  cancelLabel = 'Cancel',
  submitLabel = 'Submit',
  onCancel,
  onSubmit,
}: FormStepWizardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(() => new Set([0]));
  const isVertical = orientation === 'vertical';
  const currentStep = config[activeStep];
  const isLastStep = activeStep === config.length - 1;

  useEffect(() => {
    setActiveStep(0);
    setVisitedSteps(new Set([0]));
  }, [resetKey]);

  useEffect(() => {
    if (activeStep >= config.length) {
      setActiveStep(Math.max(0, config.length - 1));
    }
  }, [activeStep, config.length]);

  if (!currentStep) return null;

  const canContinue = currentStep.canContinue !== false;

  const handlePrimaryAction = async () => {
    if (!canContinue || isSubmitting) return;
    if (isLastStep) {
      await onSubmit();
      return;
    }
    const nextStep = Math.min(activeStep + 1, config.length - 1);
    setVisitedSteps((steps) => new Set(steps).add(nextStep));
    setActiveStep(nextStep);
  };

  return (
    <Flex direction="column" gap="4" style={{ minHeight: 0, flex: 1 }}>
      <ol
        aria-label="Form steps"
        className={`${styles.steps} ${isVertical ? styles.vertical : styles.horizontal}`}
      >
        {config.map((step, index) => {
          const isCurrent = index === activeStep;
          const isComplete = index < activeStep;
          const stepClassName = [
            styles.step,
            isCurrent && styles.current,
            isComplete && styles.completed,
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <li key={step.id} className={stepClassName}>
              <button
                type="button"
                onClick={() => {
                  if (isComplete && !isSubmitting) setActiveStep(index);
                }}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Step ${index + 1}: ${step.title}${isComplete ? ', completed' : ''}`}
                disabled={!isComplete || isSubmitting}
                className={styles.stepButton}
              >
                <span
                  aria-hidden="true"
                  className={styles.indicator}
                >
                  {isComplete ? '✓' : index + 1}
                </span>
                <Text
                  size="2"
                  weight={isCurrent ? 'bold' : 'medium'}
                  color={isCurrent ? undefined : 'gray'}
                  className={styles.stepTitle}
                >
                  {step.title}
                </Text>
              </button>
              {index < config.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`${styles.connector} ${index < activeStep ? styles.connectorComplete : ''}`}
                />
              )}
            </li>
          );
        })}
      </ol>

      {config.map((step, index) => {
        if (!visitedSteps.has(index)) return null;
        const isCurrent = index === activeStep;
        return (
          <Box
            key={step.id}
            role="region"
            aria-labelledby={`${step.id}-heading`}
            hidden={!isCurrent}
            aria-hidden={!isCurrent}
            style={{
              display: isCurrent ? undefined : 'none',
              minWidth: 0,
              flex: 1,
            }}
          >
            <Text id={`${step.id}-heading`} as="h2" size="4" weight="bold">
              {step.title}
            </Text>
            {step.description && (
              <Text as="p" size="2" color="gray" mt="1" mb="4">
                {step.description}
              </Text>
            )}
            <Box mt={step.description ? '0' : '4'}>{step.content}</Box>
          </Box>
        );
      })}

      <Flex
        justify="between"
        align="center"
        gap="3"
        style={{ marginTop: 'auto' }}
      >
        <Flex gap="2">
          {onCancel && (
            <Button
              type="button"
              variant="soft"
              color="gray"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
          )}
          {activeStep > 0 && (
            <Button
              type="button"
              variant="soft"
              onClick={() => setActiveStep((step) => Math.max(0, step - 1))}
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}
        </Flex>
        <Button
          type="button"
          onClick={handlePrimaryAction}
          disabled={!canContinue || isSubmitting}
          loading={isLastStep && isSubmitting}
        >
          {isLastStep ? submitLabel : 'Continue'}
        </Button>
      </Flex>
    </Flex>
  );
}
