import { FormAsyncValidateOrFn, FormValidateOrFn, useForm } from "@tanstack/react-form";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { FilterContext } from "./context";
import { FilterContextValue, FilterProviderProps, FilterValueMap } from "./types";

export const FilterProvider = <Item, Values extends FilterValueMap>({
  children,
  defaultValues,
  matchFunctions,
  syncWithUrl = false,
}: FilterProviderProps<Item, Values>) => {
  const navigate = useNavigate();
  // Always call useSearch unconditionally to follow React Hooks rules
  const searchParams = useSearch({ strict: false }) as Record<string, unknown>;

  // Helper to create filterFunction from values
  const createFilterFunction = useCallback(
    (values: Values) => {
      return (item: Item) => {
        if (!values) {
          return true;
        }

        return Object.entries(values).every(([fieldName, fieldValue]) => {
          const matchFn = matchFunctions[fieldName as keyof Values];
          if (!matchFn) {
            return true;
          }
          return matchFn(item, fieldValue as Values[keyof Values]);
        });
      };
    },
    [matchFunctions]
  );

  // Keep track of whether we're initializing to avoid unnecessary URL updates
  const isInitializing = useRef(true);

  // Initialize values from URL if syncWithUrl is enabled
  const initialValues = useMemo(() => {
    if (!syncWithUrl) {
      return defaultValues;
    }

    const mergedValues = { ...defaultValues };

    // Merge URL search params with default values
    Object.keys(defaultValues).forEach((key) => {
      const urlValue = searchParams[key];
      if (urlValue !== undefined) {
        mergedValues[key as keyof Values] = urlValue as Values[keyof Values];
      }
    });

    return mergedValues;
  }, [defaultValues, searchParams, syncWithUrl]);

  const [filterFunction, setFilterFunction] = useState<(item: Item) => boolean>(() =>
    createFilterFunction(initialValues)
  );

  const form = useForm<
    Values,
    FormValidateOrFn<Values>,
    FormValidateOrFn<Values>,
    FormAsyncValidateOrFn<Values>,
    FormValidateOrFn<Values>,
    FormAsyncValidateOrFn<Values>,
    FormValidateOrFn<Values>,
    FormAsyncValidateOrFn<Values>,
    FormValidateOrFn<Values>,
    FormAsyncValidateOrFn<Values>,
    FormAsyncValidateOrFn<Values>,
    never
  >({
    defaultValues: initialValues,
    listeners: {
      onChange: ({ formApi }) => {
        const values = formApi.state.values;

        // Update filterFunction based on current form values
        setFilterFunction(() => createFilterFunction(values));

        // Sync with URL if enabled (skip during initialization)
        if (syncWithUrl && !isInitializing.current) {
          // Create a clean object with only non-default values
          const urlParams: Record<string, unknown> = {};

          Object.keys(defaultValues).forEach((key) => {
            const currentValue = values[key as keyof Values];
            const defaultValue = defaultValues[key as keyof Values];

            // Only include values that differ from defaults
            if (Array.isArray(currentValue)) {
              if (currentValue.length > 0) {
                urlParams[key] = currentValue;
              }
            } else if (typeof currentValue === "string") {
              if (currentValue !== "" && currentValue !== defaultValue) {
                urlParams[key] = currentValue;
              }
            } else if (currentValue !== defaultValue) {
              urlParams[key] = currentValue;
            }
          });

          // Update URL without navigation (replace instead of push)
          void navigate({
            search: urlParams as never,
            replace: true,
          }).catch(() => {
            // Ignore navigation errors
          });
        }

        // Mark initialization as complete after first change
        if (isInitializing.current) {
          isInitializing.current = false;
        }
      },
      // Debounce form-level onChange to avoid excessive re-renders during typing
      onChangeDebounceMs: 300,
    },
  });

  // Reset function
  const reset = useCallback(() => {
    form.reset();

    // form.reset() doesn't trigger onChange listener, so manually handle side effects:
    // 1. Update filterFunction immediately (no debounce on reset for better UX)
    setFilterFunction(() => createFilterFunction(defaultValues));

    // 2. Clear URL params (empty object means no search params)
    if (syncWithUrl) {
      void navigate({
        search: {} as never,
        replace: true,
      }).catch(() => {
        // Ignore navigation errors
      });
    }
  }, [form, createFilterFunction, defaultValues, syncWithUrl, navigate]);

  const contextValue = useMemo(
    () => ({
      form,
      filterFunction,
      reset,
    }),
    [form, filterFunction, reset]
  );

  return (
    <FilterContext.Provider value={contextValue as FilterContextValue<unknown, Record<string, unknown>>}>
      {children}
    </FilterContext.Provider>
  );
};
