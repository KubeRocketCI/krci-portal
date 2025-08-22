# Filter Patterns Template

## Filter Provider Implementation

```typescript
// pages/{{pageName}}/page.tsx
export default function {{PageName}}Page() {
  const defaultNamespace = useClusterStore(useShallow((state) => state.defaultNamespace));

  const valueMap: {{EntityName}}FilterValueMap = {
    search: "",
    {{#each filterFields}}
    {{field}}: "{{defaultValue}}",
    {{/each}}
  };

  return (
    <FilterProvider
      entityID={`{{ENTITY_NAME}}_LIST::${defaultNamespace}`}
      matchFunctions={matchFunctions}
      valueMap={valueMap}
      saveToLocalStorage
    >
      <{{PageName}}Content />
    </FilterProvider>
  );
}
```

## Match Functions Template

```typescript
// constants.ts
export const matchFunctions: MatchFunctions = {
  [{{filterControlNames}}.{{FIELD_NAME}}]: (item, value) => {
    if (!value || value === "all") return true;

    {{#if stringMatch}}
    return item?.{{fieldPath}}?.toLowerCase().includes(value.toLowerCase());
    {{/if}}

    {{#if exactMatch}}
    return item?.{{fieldPath}} === value;
    {{/if}}

    {{#if arrayMatch}}
    if (!value || value.length === 0) return true;
    return value.includes(item?.{{fieldPath}});
    {{/if}}

    {{#if labelMatch}}
    const labelValue = item?.metadata?.labels?.[{{labelKey}}];
    return labelValue === value;
    {{/if}}
  },

  {{#each additionalFilters}}
  [{{filterControlNames}}.{{FILTER_NAME}}]: (item, value) => {
    {{filterLogic}}
  },
  {{/each}}
};
```

## Filter Controls Template

```typescript
// hooks/useFilter.tsx
export const useFilter = ({
  {{dataArrayName}},
  {{#each filterOptions}}
  {{optionName}},
  {{/each}}
  filterControls,
}: {{FilterHookProps}}) => {
  const { filter } = useFilterContext();

  const controls: FilterControls<{{FilterControlNames}}> = React.useMemo(() => {
    const result: FilterControls<{{FilterControlNames}}> = {};

    if (filterControls.includes({{filterControlNames}}.{{CONTROL_NAME}})) {
      result[{{filterControlNames}}.{{CONTROL_NAME}}] = {
        gridXs: 4,
        component: (
          <{{ControlComponent}}
            {{#each controlProps}}
            {{prop}}={{value}}
            {{/each}}
          />
        ),
      };
    }

    return result;
  }, [{{dependencyList}}]);

  const { filterFunction } = useFilter(matchFunctions);

  return {
    controls,
    filterFunction,
  };
};
```

## Table Integration Template

```typescript
// components/{{EntityName}}List/index.tsx
export const {{EntityName}}List = () => {
  const { controls, filterFunction } = useFilter({
    {{dataArrayName}},
    filterControls: [
      {{#each filterControls}}
      {{filterControlNames}}.{{CONTROL_NAME}},
      {{/each}}
    ],
  });

  return (
    <Table
      id={ {{TABLE_ID}} }
      data={ {{dataArrayName}} || []}
      columns={columns}
      filterFunction={filterFunction}
      slots={{
        header: <Filter controls={controls} />,
      }}
    />
  );
};
```
