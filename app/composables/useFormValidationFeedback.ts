import type {
  FormValidationError,
  FormValidationErrorEvent,
  ReportFormValidationErrorsOptions,
} from '~/utils/form-validation-feedback';

export function useFormValidationFeedback() {
  const toast = useToast();

  async function onFormError(
    event: FormValidationErrorEvent,
    options?: Omit<ReportFormValidationErrorsOptions, 'toast'>,
  ) {
    return reportFormValidationErrors(event, {
      ...options,
      toast,
    });
  }

  return {
    onFormError,
    focusFormErrorField: (error: FormValidationError) =>
      focusFormErrorField(error),
  };
}
