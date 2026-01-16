import { Actions } from "./components/Actions";
import { CodemieForm } from "./components/Codemie";
import { CodemieSecretForm } from "./components/CodemieSecret";
import { QuickLinkForm } from "./components/QuickLink";
import { useCodemieCreateForm } from "./hooks/useCodemieCreateForm";
import { useCodemieEditForm } from "./hooks/useCodemieEditForm";
import { useCodemieSecretCreateForm } from "./hooks/useCodemieSecretCreateForm";
import { useCodemieSecretEditForm } from "./hooks/useCodemieSecretEditForm";
import { useQuickLinkEditForm } from "@/core/hooks/useQuickLinkEditForm";
import { DataContextProvider } from "./providers/Data";
import { FormNames, ManageCodeMieProps, QuickLinkFormValues } from "./types";
import { MultiFormContextProvider } from "@/core/providers/MultiForm/provider";
import { QUICK_LINK_FORM_NAMES } from "./constants";

export const ManageCodeMie = ({ quickLink, codemie, codemieSecret, handleClosePanel }: ManageCodeMieProps) => {
  const quickLinkEditForm = useQuickLinkEditForm<QuickLinkFormValues>({
    quickLink,
    formFieldName: QUICK_LINK_FORM_NAMES.EXTERNAL_URL,
  });

  const codemieCreateForm = useCodemieCreateForm({ handleClosePanel });
  const codemieEditForm = useCodemieEditForm({ handleClosePanel, codemie });

  const codemieSecretCreateForm = useCodemieSecretCreateForm({ handleClosePanel });
  const codemieSecretEditForm = useCodemieSecretEditForm({
    handleClosePanel,
    secret: codemieSecret,
  });

  const codemieForm = codemie ? codemieEditForm : codemieCreateForm;

  const codemieSecretForm = codemieSecret ? codemieSecretEditForm : codemieSecretCreateForm;

  return (
    <div data-testid="form">
      <DataContextProvider
        quickLink={quickLink}
        codemie={codemie}
        codemieSecret={codemieSecret}
        handleClosePanel={handleClosePanel}
      >
        <MultiFormContextProvider<FormNames>
          forms={{
            quickLink: quickLinkEditForm,
            codemie: codemieForm,
            codemieSecret: codemieSecretForm,
          }}
        >
          <div className="flex flex-col gap-6">
            <div>
              <QuickLinkForm />
            </div>
            <div>
              <CodemieForm />
            </div>
            <div>
              <CodemieSecretForm />
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
