# Multi-Step Form Patterns Template

## Stepper Form Implementation

```typescript
// components/FormActions/index.tsx
export const FormActions = () => {
  const { activeStep, setActiveStep, nextStep, prevStep } = useStepperContext();

  const {
    reset,
    formState: { dirtyFields },
    trigger,
    handleSubmit,
    getValues
  } = useTypedFormContext();

  // Get current form section
  const activeTabFormPartName = React.useMemo(() => {
    const validEntry = Object.entries(FORM_STEPPER).find(([, { idx }]) => idx === activeStep);
    return validEntry?.[0];
  }, [activeStep]);

  // Validate current step and proceed
  const handleProceed = React.useCallback(async () => {
    const activeTabFormPartNames = Object.values({{FORM_NAMES}})
      .filter(({ formPart }) => formPart === activeTabFormPartName)
      .map(({ name }) => name);

    const hasNoErrors = await trigger(activeTabFormPartNames);

    if (hasNoErrors) {
      nextStep();
    }
  }, [activeTabFormPartName, nextStep, trigger]);

  // Error handling - jump to first error step
  const getFirstErrorStepName = (errors: Record<string, unknown>) => {
    const [firstErrorFieldName] = Object.keys(errors);
    return {{FORM_NAMES}}[firstErrorFieldName as ValueOf<typeof NAMES>].formPart;
  };

  const handleValidationError = React.useCallback(
    (errors: Record<string, unknown>) => {
      if (errors) {
        const firstErrorTabName = getFirstErrorStepName(errors);
        setActiveStep(FORM_STEPPER[firstErrorTabName].idx);
      }
    },
    [setActiveStep]
  );

  return (
    <Stack direction="row" spacing={2}>
      {activeStep > 0 && (
        <Button variant="outlined" onClick={prevStep}>
          Previous
        </Button>
      )}

      <Button variant="contained" onClick={handleProceed}>
        {activeStep === maxSteps - 1 ? 'Submit' : 'Next'}
      </Button>
    </Stack>
  );
};
```

## Form Field Template

```typescript
// components/fields/{{FieldName}}/index.tsx
export const {{FieldName}}Field = () => {
  const {
    control,
    formState: { errors },
    watch,
  } = useTypedFormContext();

  return (
    <FormTextField
      name={ {{FORM_NAMES}}.{{fieldName}}.name}
      control={control}
      errors={errors}
      label="{{Field Label}}"
      placeholder="{{Field Placeholder}}"
      tooltipText="{{Field Description}}"
      TextFieldProps={{
        {{#if required}}
        required: true,
        {{/if}}
        {{#if validation}}
        {{validation}}
        {{/if}}
      }}
    />
  );
};
```

## Form Constants Template

```typescript
// constants.ts
export const {{RESOURCE_NAME}}_FORM_NAMES = {
  {{#each formFields}}
  {{field}}: {
    name: "{{field}}" as const,
    formPart: "{{formSection}}" as const,
  },
  {{/each}}
} as const;

export const FORM_STEPPER = {
  {{#each formSections}}
  {{SECTION_NAME}}: {
    idx: {{index}},
    label: "{{Section Label}}",
  },
  {{/each}}
} as const;
```

## Form Provider Template

```typescript
// providers/{{FormName}}/provider.tsx
export const {{FormName}}ContextProvider: React.FC<{{FormName}}ContextProviderProps> = ({
  children,
  formData,
}) => {
  const methods = useForm<{{FormName}}FormValues>({
    resolver: zodResolver({{formName}}Schema),
    defaultValues: formData,
    mode: "onChange",
  });

  return (
    <FormProvider {...methods}>
      <StepperProvider>
        {children}
      </StepperProvider>
    </FormProvider>
  );
};
```
