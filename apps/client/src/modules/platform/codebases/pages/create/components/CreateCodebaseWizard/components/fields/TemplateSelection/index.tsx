import React from "react";
import { useTemplateWatchList } from "@/k8s/api/groups/KRCI/Template";
import { codebaseCreationStrategy } from "@my-project/shared";
import type { CodebaseType as CodebaseTypeValue } from "@my-project/shared";
import { useAppForm } from "@/core/form-temp";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { getCodebaseMappingByType } from "@/k8s/api/groups/KRCI/Codebase";
import { getIconByPattern } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import type { CodebaseInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";
import type { Template } from "@my-project/shared";

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

export const TemplateSelection: React.FC = () => {
  const templatesWatch = useTemplateWatchList();
  const templates = templatesWatch.data.array;

  const filterForm = useAppForm({
    defaultValues: { search: "", category: "all" },
  });

  const wizardForm = useCreateCodebaseForm();

  const categories = React.useMemo(() => Array.from(new Set(templates.map((t) => t.spec.category))), [templates]);

  const categoriesOptions = React.useMemo(
    () => [
      { label: "All", value: "all" },
      ...categories.filter((c): c is string => !!c).map((c) => ({ label: c, value: c })),
    ],
    [categories]
  );

  const [searchFieldValue, setSearchFieldValue] = React.useState("");
  const [categoryFieldValue, setCategoryFieldValue] = React.useState("all");

  React.useEffect(() => {
    const unsubscribe = filterForm.store.subscribe(() => {
      setSearchFieldValue(filterForm.state.values.search ?? "");
      setCategoryFieldValue(filterForm.state.values.category ?? "all");
    });
    return unsubscribe;
  }, [filterForm]);

  const filteredTemplates = React.useMemo(
    () =>
      templates.filter((t) => {
        const matchesSearch = t.spec.displayName.toLowerCase().includes(searchFieldValue.toLowerCase());
        const matchesCategory = categoryFieldValue === "all" || t.spec.category === categoryFieldValue;
        return matchesSearch && matchesCategory;
      }),
    [templates, searchFieldValue, categoryFieldValue]
  );

  const templateOptions = useTemplateOptions(filteredTemplates);

  return (
    <div className="space-y-2">
      <div className="mb-2 grid grid-cols-2 gap-2">
        <filterForm.AppField name="search">
          {(field) => <field.FormTextField label="Search" placeholder="Search templates..." />}
        </filterForm.AppField>
        <filterForm.AppField name="category">
          {(field) => <field.FormSelect label="Category" placeholder="Select category" options={categoriesOptions} />}
        </filterForm.AppField>
      </div>
      <LoadingWrapper isLoading={templatesWatch.query.isFetching}>
        <wizardForm.AppField
          name={NAMES.ui_creationTemplate}
          validators={{
            onChange: ({ value }) => {
              const creationMethod = wizardForm.store.state.values[NAMES.ui_creationMethod];
              return creationMethod === "template" && (!value || value.length === 0) ? "Select a template" : undefined;
            },
          }}
          listeners={{
            onChange: ({ value }) => {
              const template = templates.find((t) => t.metadata.name === value);
              if (template) {
                wizardForm.setFieldValue(NAMES.lang, template.spec.language);
                wizardForm.setFieldValue(NAMES.framework, template.spec.framework);
                wizardForm.setFieldValue(NAMES.buildTool, template.spec.buildTool);
                wizardForm.setFieldValue(NAMES.type, template.spec.type as CodebaseTypeValue);
                wizardForm.setFieldValue(
                  NAMES.strategy,
                  codebaseCreationStrategy.clone as typeof codebaseCreationStrategy.clone
                );
                wizardForm.setFieldValue(NAMES.repositoryUrl, template.spec.source);
              }
            },
          }}
        >
          {(field) => (
            <field.FormRadioGroup
              label="Select Template"
              options={templateOptions}
              variant="horizontal"
              classNames={{ container: "grid-cols-4", item: "p-3", itemIcon: "h-6 w-6", itemIconContainer: "h-8 w-8" }}
              disabled={templatesWatch.query.isLoading}
            />
          )}
        </wizardForm.AppField>
      </LoadingWrapper>
    </div>
  );
};
