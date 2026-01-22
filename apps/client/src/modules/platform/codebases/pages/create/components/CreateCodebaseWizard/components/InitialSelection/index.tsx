import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { useTemplateWatchList } from "@/k8s/api/groups/KRCI/Template";
import React from "react";
import { NAMES } from "../../names";
import {
  CodebaseType,
  CodebaseCreationStrategy,
  codebaseCreationStrategy,
  codebaseType,
  Template,
} from "@my-project/shared";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { getCodebaseMappingByType } from "@/k8s/api/groups/KRCI/Codebase";
import { getIconByPattern } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { CodebaseInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { useCreateCodebaseForm } from "../../providers/form/hooks";
import { useAppForm } from "@/core/form-temp";
import z from "zod";
import {
  Package,
  Settings,
  LayoutGrid,
  FlaskConical,
  SquareLibrary,
  CloudCog,
  FileCode,
  CopyPlus,
  CloudDownload,
} from "lucide-react";

const useTemplateOptions = (filteredTemplates: Template[]) => {
  return React.useMemo(
    () =>
      filteredTemplates.map((template) => {
        const {
          spec: { language: _language, framework: _framework, buildTool: _buildTool, type, description },
        } = template;

        const codebaseMapping = getCodebaseMappingByType(type);
        const lang = _language.toLowerCase();
        const framework = _framework ? _framework.toLowerCase() : "N/A";
        const buildTool = _buildTool.toLowerCase();
        const codebaseMappingByLang = codebaseMapping?.[
          lang as keyof typeof codebaseMapping
        ] as unknown as CodebaseInterface;

        return {
          value: template.metadata.name,
          label: template.spec.displayName,
          description: (
            <div className="space-y-2">
              <p className="line-clamp-3 text-xs">{description}</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center gap-1">
                  <UseSpriteSymbol name={getIconByPattern(_language)} width={16} height={16} />
                  <span className="text-xs">
                    {codebaseMappingByLang?.language?.name || capitalizeFirstLetter(_language)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <UseSpriteSymbol name={getIconByPattern(_framework)} width={16} height={16} />
                  <span className="text-xs">
                    {framework
                      ? codebaseMappingByLang?.frameworks?.[framework]?.name ||
                        (_framework && capitalizeFirstLetter(_framework)) ||
                        "N/A"
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <UseSpriteSymbol name={getIconByPattern(_buildTool)} width={16} height={16} />
                  <span className="text-xs">
                    {codebaseMappingByLang?.buildTools?.[buildTool]?.name || capitalizeFirstLetter(_buildTool)}
                  </span>
                </div>
              </div>
            </div>
          ),
          icon: template.spec.icon?.[0] ? (
            <img
              src={`data:${template.spec.icon[0].mediatype};base64,${template.spec.icon[0].base64data}`}
              alt={template.spec.displayName}
              width={20}
              height={20}
            />
          ) : undefined,
        };
      }),
    [filteredTemplates]
  );
};

const TemplateSelection = () => {
  const templatesWatch = useTemplateWatchList();
  const templates = templatesWatch.data.array;

  // Local form for filtering templates (separate from wizard form)
  const filterForm = useAppForm({
    defaultValues: {
      search: "",
      category: "all",
    },
  });

  const wizardForm = useCreateCodebaseForm();

  const categories = React.useMemo(() => {
    const uniqueCategories = Array.from(new Set(templates.map((template) => template.spec.category)));
    return uniqueCategories;
  }, [templates]);

  const categoriesOptions = React.useMemo(() => {
    return [
      { label: "All", value: "all" },
      ...categories
        .filter((category): category is string => !!category)
        .map((category) => ({ label: category, value: category })),
    ];
  }, [categories]);

  const [searchFieldValue, setSearchFieldValue] = React.useState("");
  const [categoryFieldValue, setCategoryFieldValue] = React.useState("all");

  // Subscribe to filter form changes
  React.useEffect(() => {
    const unsubscribe = filterForm.store.subscribe(() => {
      const state = filterForm.state;
      setSearchFieldValue(state.values.search ?? "");
      setCategoryFieldValue(state.values.category ?? "all");
    });
    return unsubscribe;
  }, [filterForm]);

  const filteredTemplates = React.useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch = template.spec.displayName.toLowerCase().includes(searchFieldValue.toLowerCase());
      const matchesCategory = categoryFieldValue === "all" || template.spec.category === categoryFieldValue;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchFieldValue, categoryFieldValue]);

  const templateOptions = useTemplateOptions(filteredTemplates);

  return (
    <div className="space-y-2">
      <div className="mb-2 grid grid-cols-2 gap-2">
        <div className="relative">
          <filterForm.AppField
            name="search"
            children={(field) => <field.FormTextField label="Search" placeholder="Search templates..." />}
          />
        </div>
        <filterForm.AppField
          name="category"
          children={(field) => (
            <field.FormSelect label="Category" placeholder="Select category" options={categoriesOptions} />
          )}
        />
      </div>
      <LoadingWrapper isLoading={templatesWatch.query.isFetching}>
        <wizardForm.AppField
          name={NAMES.ui_creationTemplate}
          validators={{
            onChange: z.string().min(1, "Select a template"),
          }}
          listeners={{
            onChange: ({ value }) => {
              const template = templates.find((template) => template.metadata.name === value);

              if (template) {
                wizardForm.setFieldValue(NAMES.lang, template.spec.language);
                wizardForm.setFieldValue(NAMES.framework, template.spec.framework);
                wizardForm.setFieldValue(NAMES.buildTool, template.spec.buildTool);
                wizardForm.setFieldValue(NAMES.type, template.spec.type as CodebaseType);
                wizardForm.setFieldValue(NAMES.strategy, codebaseCreationStrategy.clone as CodebaseCreationStrategy);
                wizardForm.setFieldValue(NAMES.repositoryUrl, template.spec.source);
              }
            },
          }}
          children={(field) => (
            <field.FormRadioGroup
              label="Select Template"
              options={templateOptions}
              variant="horizontal"
              className="grid-cols-4"
              disabled={templatesWatch.query.isLoading}
            />
          )}
        />
      </LoadingWrapper>
    </div>
  );
};

const creationMethodOptions = [
  {
    value: "template",
    label: "Select Ready Template",
    description: "Start with a pre-configured template including best practices, dependencies, and CI/CD pipelines",
    icon: Package,
  },
  {
    value: "custom",
    label: "Custom Configuration",
    description: "Configure your component manually by selecting type and creation strategy",
    icon: Settings,
  },
];

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

const strategyOptions = [
  {
    value: codebaseCreationStrategy.create,
    label: "Create",
    description: "Create an empty project and configure everything manually for maximum flexibility",
    icon: FileCode,
  },
  {
    value: codebaseCreationStrategy.clone,
    label: "Clone",
    description: "Clone code from third-party VCS providers",
    icon: CopyPlus,
  },
  {
    value: codebaseCreationStrategy.import,
    label: "Import",
    description: "Onboard your existing code to the KubeRocketCI platform",
    icon: CloudDownload,
  },
];

export const InitialSelection: React.FC = () => {
  const form = useCreateCodebaseForm();

  const [creationMethodFieldValue, setCreationMethodFieldValue] = React.useState<string | null>(null);
  const [typeFieldValue, setTypeFieldValue] = React.useState<string | null>(null);

  // Subscribe to form field changes
  React.useEffect(() => {
    const unsubscribe = form.store.subscribe(() => {
      const state = form.state;
      setCreationMethodFieldValue(state.values[NAMES.ui_creationMethod] ?? null);
      setTypeFieldValue(state.values[NAMES.type] ?? null);
    });
    return unsubscribe;
  }, [form]);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex-1 space-y-6">
        {/* Creation Method Field */}
        <form.AppField
          name={NAMES.ui_creationMethod}
          validators={{
            onChange: z.string().min(1, "Select creation method"),
          }}
          listeners={{
            onChange: ({ value }) => {
              if (value === "template") {
                form.setFieldValue(NAMES.type, "" as CodebaseType);
                form.setFieldValue(NAMES.strategy, "" as CodebaseCreationStrategy);
              } else if (value === "custom") {
                form.setFieldValue(NAMES.repositoryUrl, "");
              }
            },
          }}
          children={(field) => (
            <field.FormRadioGroup label="Creation Method" options={creationMethodOptions} variant="vertical" />
          )}
        />

        {creationMethodFieldValue === "template" && <TemplateSelection />}

        {creationMethodFieldValue === "custom" && (
          <>
            {/* Codebase Type Field */}
            <form.AppField
              name={NAMES.type}
              validators={{
                onChange: ({ value }: { value: string }) => {
                  if (!value) return "Select codebase type";
                  return undefined;
                },
              }}
              children={(field) => <field.FormRadioGroup label="Codebase Type" options={typeOptions} />}
            />

            {typeFieldValue && (
              /* Creation Strategy Field */
              <form.AppField
                name={NAMES.strategy}
                validators={{
                  onChange: ({ value }: { value: string }) => {
                    if (!value) return "Select creation strategy";
                    return undefined;
                  },
                }}
                listeners={{
                  onChange: () => {
                    if (creationMethodFieldValue === "custom") {
                      form.setFieldValue(NAMES.repositoryUrl, "");
                    }
                  },
                }}
                children={(field) => (
                  <field.FormRadioGroup
                    label="Creation Strategy"
                    options={strategyOptions}
                    variant="vertical"
                    className="grid-cols-3"
                  />
                )}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
