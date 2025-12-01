import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { CodebaseInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import { getMappingByType } from "@/k8s/api/groups/KRCI/Codebase/utils/getMappingByType";
import { getIconByPattern } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { TABLE } from "@/k8s/constants/tables";
import { Template } from "@my-project/shared";
import React from "react";
import { columnNames } from "../constants";

export const useColumns = (): TableColumn<Template>[] => {
  const { loadSettings } = useTableSettings(TABLE.TEMPLATE_LIST.id);
  const tableSettings = loadSettings();

  return React.useMemo(
    () => [
      {
        id: columnNames.ICON,
        label: "Icon",
        data: {
          render: ({
            data: {
              spec: { icon },
            },
          }) => {
            return (
              icon && (
                <img
                  className="h-[30px] px-5 align-middle"
                  src={`data:${icon[0].mediatype};base64,${icon[0].base64data}`}
                  alt=""
                />
              )
            );
          },
        },
        cell: {
          isFixed: true,
          baseWidth: 5,
          ...getSyncedColumnData(tableSettings, columnNames.ICON),
        },
      },
      {
        id: columnNames.NAME,
        label: "Name",
        data: {
          columnSortableValuePath: "spec.displayName",
          render: ({
            data: {
              spec: { displayName },
            },
          }) => <TextWithTooltip text={displayName} />,
        },
        cell: {
          baseWidth: 20,
          ...getSyncedColumnData(tableSettings, columnNames.NAME),
        },
      },
      {
        id: columnNames.DESCRIPTION,
        label: "Description",
        data: {
          render: ({
            data: {
              spec: { description },
            },
          }) => <TextWithTooltip text={description} maxLineAmount={3} />,
        },
        cell: {
          baseWidth: 25,
          ...getSyncedColumnData(tableSettings, columnNames.DESCRIPTION),
        },
      },
      {
        id: columnNames.TYPE,
        label: "Type",
        data: {
          columnSortableValuePath: "spec.type",
          render: ({
            data: {
              spec: { type },
            },
          }) => type,
        },
        cell: {
          baseWidth: 5,
          ...getSyncedColumnData(tableSettings, columnNames.TYPE),
        },
      },
      {
        id: columnNames.CATEGORY,
        label: "Category",
        data: {
          columnSortableValuePath: "spec.category",
          render: ({
            data: {
              spec: { category },
            },
          }) => category,
        },
        cell: {
          baseWidth: 5,
          ...getSyncedColumnData(tableSettings, columnNames.CATEGORY),
        },
      },
      {
        id: columnNames.LANGUAGE,
        label: "Language",
        data: {
          columnSortableValuePath: "spec.language",
          render: ({
            data: {
              spec: { language: _language, type },
            },
          }) => {
            const codebaseMapping = getMappingByType(type);
            const lang = _language.toLowerCase();
            const codebaseMappingByLang = codebaseMapping?.[
              lang as keyof typeof codebaseMapping
            ] as unknown as CodebaseInterface;

            return (
              <div className="flex flex-nowrap items-center gap-2">
                <div>
                  <UseSpriteSymbol name={getIconByPattern(_language)} width={20} height={20} />
                </div>
                <div>{codebaseMappingByLang?.language?.name || capitalizeFirstLetter(_language)}</div>
              </div>
            );
          },
        },
        cell: {
          baseWidth: 10,
          ...getSyncedColumnData(tableSettings, columnNames.LANGUAGE),
        },
      },
      {
        id: columnNames.FRAMEWORK,
        label: "Framework",
        data: {
          columnSortableValuePath: "spec.framework",
          render: ({
            data: {
              spec: { language: _language, framework: _framework, type },
            },
          }) => {
            const codebaseMapping = getMappingByType(type);
            const lang = _language.toLowerCase();
            const framework = _framework ? _framework.toLowerCase() : "N/A";
            const codebaseMappingByLang = codebaseMapping?.[
              lang as keyof typeof codebaseMapping
            ] as unknown as CodebaseInterface;

            return (
              <div className="flex flex-nowrap items-center gap-2">
                <div>
                  <UseSpriteSymbol name={getIconByPattern(_framework)} width={20} height={20} />
                </div>
                <div>
                  {framework
                    ? codebaseMappingByLang?.frameworks?.[framework]?.name ||
                      (_framework && capitalizeFirstLetter(_framework)) ||
                      "N/A"
                    : "N/A"}
                </div>
              </div>
            );
          },
        },
        cell: {
          baseWidth: 10,
          ...getSyncedColumnData(tableSettings, columnNames.FRAMEWORK),
        },
      },
      {
        id: columnNames.BUILD_TOOL,
        label: "Build Tool",
        data: {
          columnSortableValuePath: "spec.buildTool",
          render: ({
            data: {
              spec: { language: _language, buildTool: _buildTool, type },
            },
          }) => {
            const codebaseMapping = getMappingByType(type);
            const lang = _language.toLowerCase();
            const buildTool = _buildTool.toLowerCase();
            const codebaseMappingByLang = codebaseMapping?.[
              lang as keyof typeof codebaseMapping
            ] as unknown as CodebaseInterface;

            return (
              <div className="flex flex-nowrap items-center gap-2">
                <div>
                  <UseSpriteSymbol name={getIconByPattern(_buildTool)} width={20} height={20} />
                </div>
                <div>{codebaseMappingByLang?.buildTools?.[buildTool]?.name || capitalizeFirstLetter(_buildTool)}</div>
              </div>
            );
          },
        },
        cell: {
          baseWidth: 10,
          ...getSyncedColumnData(tableSettings, columnNames.BUILD_TOOL),
        },
      },
      {
        id: columnNames.MATURITY,
        label: "Maturity",
        data: {
          columnSortableValuePath: "spec.maturity",
          render: ({
            data: {
              spec: { maturity },
            },
          }) => maturity,
        },
        cell: {
          baseWidth: 5,
          ...getSyncedColumnData(tableSettings, columnNames.MATURITY),
        },
      },
    ],
    [tableSettings]
  );
};
