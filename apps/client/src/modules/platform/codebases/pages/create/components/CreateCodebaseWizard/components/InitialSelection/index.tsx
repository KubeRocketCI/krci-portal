import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { useTemplateWatchList } from "@/k8s/api/groups/KRCI/Template";
import { CodebaseTypeField } from "@/modules/platform/codebases/components/form-fields/CodebaseType";
import { CreationMethodField } from "@/modules/platform/codebases/components/form-fields/CreationMethod";
import { CreationStrategyField } from "@/modules/platform/codebases/components/form-fields/CreationStrategy";
import React from "react";
import { useForm, useFormContext } from "react-hook-form";
import { NAMES } from "../../names";
import { FormRadioGroup } from "@/core/providers/Form/components/FormRadioGroup";
import { FieldEvent } from "@/core/types/forms";
import { useTypedFormContext } from "../../hooks/useTypedFormContext";
import { CodebaseType, CodebaseCreationStrategy, codebaseCreationStrategy, Template } from "@my-project/shared";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { getCodebaseMappingByType } from "@/k8s/api/groups/KRCI/Codebase";
import { getIconByPattern } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { CodebaseInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";

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

  const filterForm = useForm<{
    search: string;
    category: string;
  }>({
    defaultValues: {
      search: "",
      category: "all",
    },
  });

  const wizardForm = useTypedFormContext();

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

  const searchFieldValue = filterForm.watch("search");
  const categoryFieldValue = filterForm.watch("category");

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
          <FormTextField
            {...filterForm.register("search")}
            label="Search"
            placeholder="Search templates..."
            control={filterForm.control}
            errors={filterForm.formState.errors}
          />
        </div>
        <FormSelect
          {...filterForm.register("category")}
          label="Category"
          placeholder="Select category"
          control={filterForm.control}
          errors={filterForm.formState.errors}
          options={categoriesOptions}
        />
      </div>
      <LoadingWrapper isLoading={templatesWatch.query.isFetching}>
        <FormRadioGroup
          {...wizardForm.register("ui_creationTemplate", {
            required: "Select a template",
            onChange: (event: FieldEvent<string>) => {
              const template = templates.find((template) => template.metadata.name === event.target.value);

              if (template) {
                wizardForm.setValue(NAMES.lang, template.spec.language);
                wizardForm.setValue(NAMES.framework, template.spec.framework);
                wizardForm.setValue(NAMES.buildTool, template.spec.buildTool);
                wizardForm.setValue(NAMES.type, template.spec.type as CodebaseType);
                wizardForm.setValue(NAMES.strategy, codebaseCreationStrategy.clone as CodebaseCreationStrategy);
                wizardForm.setValue(NAMES.repositoryUrl, template.spec.source);
              }
            },
          })}
          label="Select Template"
          control={wizardForm.control}
          errors={wizardForm.formState.errors}
          options={templateOptions}
          variant="horizontal"
          className="grid-cols-4"
          disabled={templatesWatch.query.isLoading}
        />
      </LoadingWrapper>
    </div>
  );
};

export const InitialSelection: React.FC = () => {
  const { watch } = useFormContext();

  const creationMethodFieldValue = watch(NAMES.ui_creationMethod);
  const typeFieldValue = watch(NAMES.type);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex-1 space-y-6">
        <CreationMethodField />

        {creationMethodFieldValue === "template" && <TemplateSelection />}

        {creationMethodFieldValue === "custom" && <CodebaseTypeField />}

        {creationMethodFieldValue === "custom" && typeFieldValue && (
          <CreationStrategyField creationMethodValue={creationMethodFieldValue} />
        )}
      </div>
    </div>
  );
};
