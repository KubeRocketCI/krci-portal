import { WIDGET_TYPE } from "../../../constants";
import { Table } from "lucide-react";
import type { AddNewWidgetFormInstance } from "../index";

export const Selection = ({ form }: { form: AddNewWidgetFormInstance }) => {
  return (
    <form.AppField name="widgetType">
      {(field) => (
        <field.FormRadioGroup
          variant="tile"
          options={[
            {
              value: WIDGET_TYPE.APP_VERSION,
              label: "Application Deployed Versions",
              description: "Displays the deployed versions of the application found in all the Environments.",
              icon: <Table size={24} color="#002446" />,
              checkedIcon: <Table size={24} color="#002446" />,
            },
          ]}
        />
      )}
    </form.AppField>
  );
};
