import { useQuickLinkForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";
import { useCurrentDialog } from "../../../providers/CurrentDialog/hooks";
import { SvgBase64Icon } from "@/core/components/SvgBase64Icon";
import { useStore } from "@tanstack/react-form";

export const Icon = () => {
  const form = useQuickLinkForm();

  const {
    props: { isSystem },
  } = useCurrentDialog();

  // Subscribe to the icon field value for the preview
  // This replaces RHF's watch() with TanStack Form's useStore
  const iconValue = useStore(form.store, (state) => state.values[NAMES.ICON]);

  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex-1">
        <form.AppField
          name={NAMES.ICON}
          validators={{
            onChange: ({ value }) => {
              if (!value) return "Paste the SVG code for the icon, encoded in base64 format.";
              return undefined;
            },
          }}
        >
          {(field) => (
            <field.FormTextarea
              label="Icon(svg in base64)"
              tooltipText="Paste the SVG code for your desired icon, encoded in base64 format. Ensure the SVG is simple, clear, and recognizable even in a small size."
              placeholder="svg in base64"
              rows={5}
              disabled={isSystem}
            />
          )}
        </form.AppField>
      </div>
      <div className="w-1/4">
        <SvgBase64Icon width={100} height={100} icon={iconValue} />
      </div>
    </div>
  );
};
