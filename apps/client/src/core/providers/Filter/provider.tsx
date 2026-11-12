import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FilterContext } from "./context";
import { ApplyFilterValuesOptions, FilterContextValue, FilterProviderProps, FilterValueMap } from "./types";
import { getNonDefaultFilterValues } from "./utils";
import { useAppForm } from "@/core/components/form";
import { useStore } from "@tanstack/react-form";

export const FilterProvider = <Item, Values extends FilterValueMap>({
  children,
  defaultValues,
  matchFunctions,
  syncWithUrl = false,
  normalizeUrlValues,
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

  // Set while reset/applyValues replace the form state; they write the URL themselves.
  const isReplacingValues = useRef(false);

  // Filter URL writes still in flight. URL changes seen meanwhile are this provider's own echoes.
  const pendingUrlWrites = useRef(0);

  // Filter values as read from the URL (defaults when not URL-synced).
  const urlValues = useMemo(() => {
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

    if (!normalizeUrlValues) {
      return mergedValues;
    }

    return { ...mergedValues, ...normalizeUrlValues(mergedValues) };
  }, [defaultValues, searchParams, syncWithUrl, filterKeys, normalizeUrlValues]);

  // The form is seeded once; later URL changes reach it through the URL → form effect below.
  const [initialValues] = useState(urlValues);

  const [filterFunction, setFilterFunction] = useState<(item: Item) => boolean>(() =>
    createFilterFunction(initialValues)
  );

  const form = useAppForm({
    defaultValues: initialValues,
  });

  // Last values acted on; store events that do not change values (focus, touched meta) are ignored.
  const lastValues = useRef<Values>(form.store.state.values);

  // Replaces the filter params in the URL; params owned by others (e.g. tab, view) are kept.
  const writeFilterParams = useCallback(
    (filterParams: Partial<Values>, options?: ApplyFilterValuesOptions) => {
      pendingUrlWrites.current += 1;
      void navigate({
        search: ((prev: Record<string, unknown>) => {
          const preserved = { ...prev };
          filterKeys.forEach((key) => {
            delete preserved[key];
          });
          return { ...preserved, ...filterParams, ...options?.search };
        }) as never,
        replace: options?.replace ?? true,
      })
        .catch(() => {
          // Ignore navigation errors
        })
        .finally(() => {
          pendingUrlWrites.current -= 1;
        });
    },
    [filterKeys, navigate]
  );

  // Form → filterFunction and URL.
  useEffect(() => {
    const unsubscribe = form.store.subscribe(() => {
      const values = form.store.state.values;
      if (isReplacingValues.current || values === lastValues.current) {
        return;
      }
      lastValues.current = values;

      setFilterFunction(() => createFilterFunction(values));

      if (syncWithUrl) {
        writeFilterParams(getNonDefaultFilterValues(values, defaultValues, filterKeys));
      }
    });

    return unsubscribe;
  }, [form.store, createFilterFunction, syncWithUrl, defaultValues, filterKeys, writeFilterParams]);

  const replaceValues = useCallback(
    (values: Values) => {
      isReplacingValues.current = true;
      try {
        // keepDefaultValues: a later reset() must still return to the provider defaults.
        form.reset(values, { keepDefaultValues: true });
      } finally {
        isReplacingValues.current = false;
      }
      lastValues.current = form.store.state.values;
      setFilterFunction(() => createFilterFunction(values));
    },
    [form, createFilterFunction]
  );

  // URL → form: browser Back/Forward and links that change filter params while mounted.
  useEffect(() => {
    if (!syncWithUrl || pendingUrlWrites.current > 0) {
      return;
    }

    const fromUrl = JSON.stringify(getNonDefaultFilterValues(urlValues, defaultValues, filterKeys));
    const fromForm = JSON.stringify(getNonDefaultFilterValues(form.store.state.values, defaultValues, filterKeys));

    if (fromUrl !== fromForm) {
      replaceValues(urlValues);
    }
  }, [urlValues, syncWithUrl, defaultValues, filterKeys, form, replaceValues]);

  const reset = useCallback(() => {
    replaceValues(defaultValues);

    if (syncWithUrl) {
      writeFilterParams({});
    }
  }, [replaceValues, defaultValues, syncWithUrl, writeFilterParams]);

  const applyValues = useCallback(
    (values: Partial<Values>, options?: ApplyFilterValuesOptions) => {
      const merged = { ...defaultValues, ...values };
      const next = normalizeUrlValues ? { ...merged, ...normalizeUrlValues(merged) } : merged;

      replaceValues(next);

      if (syncWithUrl) {
        writeFilterParams(getNonDefaultFilterValues(next, defaultValues, filterKeys), options);
      }
    },
    [defaultValues, normalizeUrlValues, replaceValues, syncWithUrl, writeFilterParams, filterKeys]
  );

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
      applyValues,
      isDefaultValue,
    }),
    [form, filterFunction, reset, applyValues, isDefaultValue]
  );

  return (
    <FilterContext.Provider value={contextValue as unknown as FilterContextValue<unknown, Record<string, unknown>>}>
      {children}
    </FilterContext.Provider>
  );
};
