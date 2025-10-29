import { Actions } from "./components/Actions";
import { QuickLinkForm } from "./components/QuickLink";
import { SecretForm } from "./components/Secret";
import { useQuickLinkEditForm } from "./hooks/useQuickLinkEditForm";
import { useSecretCreateForm } from "./hooks/useSecretCreateForm";
import { useSecretEditForm } from "./hooks/useSecretEditForm";
import { DataContextProvider } from "./providers/Data";
import { FormNames, ManageArgoCDCIProps } from "./types";
import { MultiFormContextProvider } from "@/core/providers/MultiForm/provider";

export const ManageArgoCD = ({ quickLink, secret, mode, ownerReference, handleClosePanel }: ManageArgoCDCIProps) => {
  const secretCreateForm = useSecretCreateForm({ handleClosePanel });

  const secretEditForm = useSecretEditForm({ handleClosePanel, secret });

  const quickLinkEditForm = useQuickLinkEditForm({
    quickLink,
  });

  const secretForm = secret ? secretEditForm : secretCreateForm;

  return (
    <div data-testid="form">
      <DataContextProvider
        secret={secret}
        quickLink={quickLink}
        mode={mode}
        ownerReference={ownerReference}
        handleClosePanel={handleClosePanel}
      >
        <MultiFormContextProvider<FormNames>
          forms={{
            quickLink: quickLinkEditForm,
            secret: secretForm,
          }}
        >
          <div className="flex flex-col gap-6">
            <div>
              <QuickLinkForm />
            </div>
            <div>
              <SecretForm />
            </div>
            <div>
              <Actions />
            </div>
          </div>
        </MultiFormContextProvider>
      </DataContextProvider>
    </div>
  );
};
