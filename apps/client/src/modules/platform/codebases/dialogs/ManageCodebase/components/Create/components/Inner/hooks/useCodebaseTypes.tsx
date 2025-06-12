import { TileRadioGroupOption } from "@/core/providers/Form/components/MainRadioGroup/types";
import { codebaseType } from "@my-project/shared";
import { CloudCog, FlaskConical, LayoutGrid, SquareLibrary } from "lucide-react";

export const useCodebaseTypeOptions = (): TileRadioGroupOption[] => {
  return [
    {
      value: codebaseType.infrastructure,
      label: "Infrastructure",
      description:
        "Deploys and manages the infrastructure components in cloud environments using Infrastructure as Code (IaC) approach. Manage, Version and Promote your IaC environments here.",
      icon: <CloudCog size={24} color="#002446" />,
      checkedIcon: <CloudCog size={24} color="#002446" />,
    },
    {
      value: codebaseType.application,
      label: "Application",
      description:
        "Deploys services and includes configuration files, deployment scripts, and other resources needed to create and manage the application's infrastructure.",
      icon: <LayoutGrid size={24} color="#002446" />,
      checkedIcon: <LayoutGrid size={24} color="#002446" />,
    },
    {
      value: codebaseType.library,
      label: "Library",
      description:
        "Provides reusable code that can be incorporated into services. It includes additional functions, modules that might be shared across services.",
      icon: <SquareLibrary size={24} color="#002446" />,
      checkedIcon: <SquareLibrary size={24} color="#002446" />,
    },
    {
      value: codebaseType.autotest,
      label: "Autotest",
      description: "Onboard and start defining Quality Gate for deployment pipelines here.",
      icon: <FlaskConical size={24} color="#002446" />,
      checkedIcon: <FlaskConical size={24} color="#002446" />,
    },
  ];
};
