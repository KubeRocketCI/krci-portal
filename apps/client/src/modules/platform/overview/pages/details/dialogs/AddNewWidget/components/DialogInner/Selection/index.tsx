import { TileRadioGroup } from "@/core/providers/Form/components/MainRadioGroup";
import { UseFormReturn } from "react-hook-form";
import { WIDGET_TYPE } from "../../../constants";
import { Table } from "lucide-react";

export const Selection = ({
  form,
}: {
  form: UseFormReturn<Record<"widgetType", string>, unknown, Record<"widgetType", string>>;
}) => {
  return (
    <TileRadioGroup
      {...form.register("widgetType")}
      control={form.control}
      errors={form.formState.errors}
      options={[
        {
          value: WIDGET_TYPE.APP_VERSION,
          label: "Application Deployed Versions",
          description: "Displays the deployed versions of the application found in all the Environments.",
          icon: <Table size={24} color="#002446" />,
          checkedIcon: <Table size={24} color="#002446" />,
        },
      ]}
      gridCols={1}
    />
  );
};
