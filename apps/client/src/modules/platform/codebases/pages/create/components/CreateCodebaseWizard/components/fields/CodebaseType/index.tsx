import React from "react";
import { codebaseType } from "@my-project/shared";
import { LayoutGrid, FlaskConical, SquareLibrary, CloudCog } from "lucide-react";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

const typeOptions = [
  {
    value: codebaseType.application,
    label: "Application",
    description:
      "Deploys services and includes configuration files, deployment scripts, and other resources needed to create and manage the application's infrastructure.",
    icon: LayoutGrid,
  },
  {
    value: codebaseType.autotest,
    label: "Autotest",
    description: "Onboard and start defining Quality Gate for deployment pipelines here.",
    icon: FlaskConical,
  },
  {
    value: codebaseType.library,
    label: "Library",
    description:
      "Provides reusable code that can be incorporated into services. It includes additional functions, modules that might be shared across services.",
    icon: SquareLibrary,
  },
  {
    value: codebaseType.infrastructure,
    label: "Infrastructure",
    description:
      "Deploys and manages the infrastructure components in cloud environments using Infrastructure as Code (IaC) approach. Manage, Version and Promote your IaC environments here.",
    icon: CloudCog,
  },
];

export const CodebaseType: React.FC = () => {
  const form = useCreateCodebaseForm();

  return (
    <form.AppField
      name={NAMES.type}
      validators={{
        onChange: ({ value }) => {
          const creationMethod = form.store.state.values[NAMES.ui_creationMethod];
          return creationMethod === "custom" && !value ? "Select codebase type" : undefined;
        },
      }}
    >
      {(field) => (
        <field.FormRadioGroup
          label="Codebase Type"
          options={typeOptions}
          classNames={{ item: "p-3", itemIcon: "h-6 w-6", itemIconContainer: "h-8 w-8" }}
        />
      )}
    </form.AppField>
  );
};
