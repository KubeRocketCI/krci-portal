import React from "react";
import { useStore } from "@tanstack/react-form";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

const RepositoryLogin: React.FC = () => {
  const form = useCreateCodebaseForm();

  return (
    <form.AppField
      name={NAMES.ui_repositoryLogin}
      validators={{
        onChange: ({ value }) => {
          if (!value || value.trim().length === 0) return "Enter repository login";
          if (!/\w/.test(value)) return "Enter valid repository login";
          return undefined;
        },
      }}
    >
      {(field) => <field.FormTextField label="Repository Login" placeholder="Enter login" />}
    </form.AppField>
  );
};

const RepositoryPasswordOrApiToken: React.FC = () => {
  const form = useCreateCodebaseForm();

  return (
    <form.AppField
      name={NAMES.ui_repositoryPasswordOrApiToken}
      validators={{
        onChange: ({ value }) => {
          if (!value || value.trim().length === 0) return "Enter the repository password or access token";
          if (!/\w/.test(value)) return "Enter valid repository password or api token";
          return undefined;
        },
      }}
    >
      {(field) => (
        <field.FormTextField label="Password or API Token" placeholder="Enter password or token" type="password" />
      )}
    </form.AppField>
  );
};

export const RepositoryCredentials: React.FC = () => {
  const form = useCreateCodebaseForm();
  const hasCodebaseAuth = useStore(form.store, (s) => s.values[NAMES.ui_hasCodebaseAuth] ?? false);

  return (
    <form.AppField name={NAMES.ui_hasCodebaseAuth}>
      {(field) => (
        <field.FormSwitch
          label="Repository credentials"
          helperText="Provide authentication for private repositories"
          rich
          variant="list"
          expandableContent={
            hasCodebaseAuth ? (
              <div className="grid grid-cols-2 gap-4 rounded-lg">
                <RepositoryLogin />
                <RepositoryPasswordOrApiToken />
              </div>
            ) : null
          }
        />
      )}
    </form.AppField>
  );
};
