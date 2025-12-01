import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import React from "react";
import { DataTable } from "../..";
import { TableColumn } from "../../types";
import { useTableSettings } from "./hooks/useTableSettings";
import { TableSettingColumn, TableSettingsColumns, TableSettingsProps } from "./types";
import { useForm } from "react-hook-form";
import { Settings } from "lucide-react";
import { ValueOf } from "@/core/types/global";

const getSettingsColumns = <DataType,>(columns: TableColumn<DataType>[]) => {
  return columns.reduce<TableSettingsColumns<DataType>>((acc, cur) => {
    acc[cur.id] = {
      id: cur.id,
      label: cur.label,
      show: true,
      disabled: cur.cell?.isFixed === true,
    };
    return acc;
  }, {});
};

const getShownColumnIds = <DataType,>(columns: TableColumn<DataType>[]) => {
  return columns.filter(({ cell: { show } }) => !!show).map(({ id }) => id);
};

const NAMES = {
  selected: "selected",
} as const;

export const TableSettings = <DataType,>({ id, name, columns, setColumns }: TableSettingsProps<DataType>) => {
  const {
    reset,
    setValue,
    getValues,
    watch,
    formState: { isDirty },
  } = useForm<Record<ValueOf<typeof NAMES>, string[]>>({
    mode: "onChange",
    defaultValues: {
      [NAMES.selected]: getShownColumnIds(columns),
    },
  });

  const { saveSettings } = useTableSettings(id);

  const [open, setOpen] = React.useState(false);

  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    setOpen(false);

    reset();
  };

  const handleSelectAllClick = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, items: TableSettingColumn<DataType>[]) => {
      if (event.target.checked) {
        const newSelected = items.map(({ id }) => id);
        setValue(NAMES.selected, newSelected, { shouldDirty: true });
        return;
      }
      const disabledItems = items.filter(({ disabled }) => disabled).map(({ id }) => id);

      setValue(NAMES.selected, disabledItems, { shouldDirty: true });
    },
    [setValue]
  );

  const handleSelectRowClick = React.useCallback(
    (_event: React.MouseEvent<unknown>, row: TableSettingColumn<DataType>) => {
      const values = getValues();
      const selected = values.selected;
      const name = row.id;
      const selectedIndex = selected.indexOf(name);
      let newSelected: string[] = [];

      if (selectedIndex === -1) {
        newSelected = newSelected.concat(selected, name);
      } else if (selectedIndex === 0) {
        newSelected = newSelected.concat(selected.slice(1));
      } else if (selectedIndex === selected.length - 1) {
        newSelected = newSelected.concat(selected.slice(0, -1));
      } else if (selectedIndex > 0) {
        newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
      }

      setValue(NAMES.selected, newSelected, { shouldDirty: true });
    },
    [getValues, setValue]
  );

  const handleSave = () => {
    const values = getValues();
    const selected = values.selected;

    setColumns((prev) => {
      const result = prev.reduce<{
        columns: TableColumn<DataType>[];
        settings: Record<string, { id: string; show: boolean }>;
      }>(
        (accumulator, column) => {
          accumulator.columns.push({
            ...column,
            cell: {
              ...column.cell,
              show: selected.includes(column.id),
            },
          });

          accumulator.settings = {
            ...accumulator.settings,
            [column.id]: {
              id: column.id,
              show: selected.includes(column.id),
            },
          };

          return accumulator;
        },
        { columns: [], settings: {} }
      );

      saveSettings(result.settings);

      return result.columns;
    });

    setOpen(false);
    reset(values, { keepValues: true, keepDirty: false });
  };

  const selected = watch(NAMES.selected);

  return (
    <>
      <Tooltip title={"Table Settings"}>
        <Button variant="ghost" size="icon" onClick={handleOpen}>
          <Settings />
        </Button>
      </Tooltip>
      <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="w-full max-w-2xl">
          <DialogHeader>
            <DialogTitle>{`Table "${name}" Settings`}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-4">
              <DataTable
                id="tableSettings"
                name="Table Settings"
                isLoading={false}
                data={Object.values(getSettingsColumns(columns))}
                columns={[
                  {
                    id: "column",
                    label: "Column Name",
                    data: {
                      render: ({ data }) => data?.label || "",
                    },
                    cell: {
                      baseWidth: 100,
                    },
                  },
                ]}
                selection={{
                  handleSelectAll: handleSelectAllClick,
                  handleSelectRow: handleSelectRowClick,
                  selected,
                  isRowSelected: (row) => selected.includes(row.id),
                  isRowSelectable: (row) => !row.disabled,
                }}
                settings={{
                  show: false,
                }}
                pagination={{
                  rowsPerPage: columns.length,
                  show: false,
                  initialPage: 0,
                  reflectInURL: false,
                }}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button onClick={handleClose} variant="ghost">
              Close
            </Button>
            <Button onClick={handleSave} disabled={!isDirty}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
