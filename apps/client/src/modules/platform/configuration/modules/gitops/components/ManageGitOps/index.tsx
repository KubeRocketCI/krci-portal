import { Create } from "./components/Create";
import { FormActions } from "./components/FormActions";
import { View } from "./components/View";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { ManageGitOpsProps } from "./types";
import { FormContextProvider } from "@/core/providers/Form/provider";

export const ManageGitOps = ({ formData }: ManageGitOpsProps) => {
  const baseDefaultValues = useDefaultValues({ formData });

  const { isReadOnly } = formData;

  return (
    <FormContextProvider
      formSettings={{
        defaultValues: baseDefaultValues,
        mode: "onBlur",
      }}
      formData={formData}
    >
      <div className="flex flex-col gap-4" data-testid="form">
        <div>
          {isReadOnly ? <View /> : <Create />}
        </div>
        <div>
          <FormActions />
        </div>
      </div>
    </FormContextProvider>
  );
};
