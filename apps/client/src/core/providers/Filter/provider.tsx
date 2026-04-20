import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FilterContext } from "./context";
import { FilterContextValue, FilterProviderProps, FilterValueMap } from "./types";
import { useAppForm } from "@/core/components/form";
import { useStore } from "@tanstack/react-form";

export const FilterProvider = <Item, Values extends FilterValueMap>({
  children,
  defaultValues,
  matchFunctions,
  syncWithUrl = false,
}: FilterProviderProps<Item, Values>) => {
  const navigate = useNavigate();
  // Always call useSearch unconditionally to follow React Hooks rules
  const searchParams = useSearch({ strict: false }) as Record<string, unknown>;

  const filterKeys = useMemo(() => Object.keys(defaultValues), [defaultValues]);

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
    filterKeys.forEach((key) => {
      const urlValue = searchParams[key];
      if (urlValue !== undefined) {
        mergedValues[key as keyof Values] = urlValue as Values[keyof Values];
      }
    });

    return mergedValues;
  }, [defaultValues, searchParams, syncWithUrl, filterKeys]);

  const [filterFunction, setFilterFunction] = useState<(item: Item) => boolean>(() =>
    createFilterFunction(initialValues)
  );

  const form = useAppForm({
    defaultValues: initialValues,
  });

  // Subscribe to form changes using useEffect for proper cleanup
  useEffect(() => {
    const unsubscribe = form.store.subscribe(() => {
      const values = form.store.state.values;

      // Update filterFunction based on current form values
      setFilterFunction(() => createFilterFunction(values));

      // Sync with URL if enabled (skip during initialization)
      if (syncWithUrl && !isInitializing.current) {
        // Create a clean object with only non-default values
        const filterParams: Record<string, unknown> = {};

        filterKeys.forEach((key) => {
          const currentValue = values[key as keyof Values];
          const defaultValue = defaultValues[key as keyof Values];

          // Only include values that differ from defaults
          if (Array.isArray(currentValue)) {
            if (currentValue.length > 0) {
              filterParams[key] = currentValue;
            }
          } else if (typeof currentValue === "string") {
            if (currentValue !== "" && currentValue !== defaultValue) {
              filterParams[key] = currentValue;
            }
          } else if (currentValue !== defaultValue) {
            filterParams[key] = currentValue;
          }
        });

        // Preserve unrelated search params (e.g. tab, pipelinesTab) by merging
        void navigate({
          search: ((prev: Record<string, unknown>) => {
            const preserved = { ...prev };
            filterKeys.forEach((key) => {
              delete preserved[key];
            });
            return { ...preserved, ...filterParams };
          }) as never,
          replace: true,
        }).catch(() => {
          // Ignore navigation errors
        });
      }

      // Mark initialization as complete after first change
      if (isInitializing.current) {
        isInitializing.current = false;
      }
    });

    return unsubscribe;
  }, [form.store, createFilterFunction, syncWithUrl, defaultValues, filterKeys, navigate]);

  // Reset function
  const reset = useCallback(() => {
    form.reset();

    // form.reset() doesn't trigger onChange listener, so manually handle side effects:
    // 1. Update filterFunction immediately (no debounce on reset for better UX)
    setFilterFunction(() => createFilterFunction(defaultValues));

    // 2. Clear only filter-related URL params, preserve others (e.g. tab)
    if (syncWithUrl) {
      void navigate({
        search: ((prev: Record<string, unknown>) => {
          const preserved = { ...prev };
          filterKeys.forEach((key) => {
            delete preserved[key];
          });
          return preserved;
        }) as never,
        replace: true,
      }).catch(() => {
        // Ignore navigation errors
      });
    }
  }, [form, createFilterFunction, defaultValues, filterKeys, syncWithUrl, navigate]);

  const isDefaultValue = useStore(form.store, (state) => {
    const vals = state.values as Record<string, unknown>;
    const defs = defaultValues as Record<string, unknown>;
    return Object.keys(defs).every((key) => {
      const current = vals[key];
      const def = defs[key];
      return Array.isArray(current) ? current.length === 0 : current === def;
    });
  });

  const contextValue: FilterContextValue<Item, Values> = useMemo(
    () => ({
      form,
      filterFunction,
      reset,
      isDefaultValue,
    }),
    [form, filterFunction, reset, isDefaultValue]
  );

  return (
    <FilterContext.Provider value={contextValue as unknown as FilterContextValue<unknown, Record<string, unknown>>}>
      {children}
    </FilterContext.Provider>
  );
};
