import { Filter } from "@/core/providers/Filter/components/Filter";
import { SearchControl } from "@/core/providers/Filter/components/Filter/components/SearchControl";

export const TemplateFilter = () => {
  return (
    <Filter
      controls={{
        search: {
          component: <SearchControl />,
        },
      }}
    />
  );
};
