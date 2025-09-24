import { Grid } from "@mui/material";
import { Actions } from "./components/Actions";
import { CodemieForm } from "./components/Codemie";
import { CodemieSecretForm } from "./components/CodemieSecret";
import { QuickLinkForm } from "./components/QuickLink";
import { useCodemieCreateForm } from "./hooks/useCodemieCreateForm";
import { useCodemieEditForm } from "./hooks/useCodemieEditForm";
import { useCodemieSecretCreateForm } from "./hooks/useCodemieSecretCreateForm";
import { useCodemieSecretEditForm } from "./hooks/useCodemieSecretEditForm";
import { useQuickLinkEditForm } from "./hooks/useQuickLinkEditForm";
import { DataContextProvider } from "./providers/Data";
import { FormNames, ManageCodeMieProps } from "./types";
import { MultiFormContextProvider } from "@/core/providers/MultiForm/provider";

export const ManageCodeMie = ({ quickLink, codemie, codemieSecret, handleClosePanel }: ManageCodeMieProps) => {
  const quickLinkEditForm = useQuickLinkEditForm({
    quickLink,
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
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <QuickLinkForm />
            </Grid>
            <Grid item xs={12}>
              <CodemieForm />
            </Grid>
            <Grid item xs={12}>
              <CodemieSecretForm />
            </Grid>
            <Grid item xs={12}>
              <Actions />
            </Grid>
          </Grid>
        </MultiFormContextProvider>
      </DataContextProvider>
    </div>
  );
};
