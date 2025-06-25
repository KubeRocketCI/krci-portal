import { FilterContextProvider } from "@/core/providers/Filter/provider";
import { useClusterStore } from "@/core/store";
import { ComponentList } from "./components/ComponentList";
import { matchFunctions } from "./constants";
import { EDP_USER_GUIDE } from "@/core/k8s/constants/docs-urls";

export default function ComponentListPage() {
  const defaultNamespace = useClusterStore((state) => state.defaultNamespace);

  return (
    <FilterContextProvider
      entityID={`CODEBASE_LIST::${defaultNamespace}`}
      matchFunctions={matchFunctions}
      saveToLocalStorage
    >
      <div className="space-y-4">
        <h1 className="text-4xl">Components</h1>
        <p>
          Create, view, and manage diverse codebases, encompassing applications, libraries, autotests, and Terraform
          infrastructure code.{" "}
          <a href={EDP_USER_GUIDE.APPLICATION_CREATE.url} target={"_blank"} className="text-primary hover:underline">
            <span>Learn more.</span>
          </a>
        </p>
      </div>
      <ComponentList />
    </FilterContextProvider>
  );
}
