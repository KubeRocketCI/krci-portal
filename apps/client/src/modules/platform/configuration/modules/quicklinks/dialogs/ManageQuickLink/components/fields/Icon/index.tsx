import { useTypedFormContext } from "../../../hooks/useFormContext";
import { QUICK_LINK_FORM_NAMES } from "../../../names";
import { useCurrentDialog } from "../../../providers/CurrentDialog/hooks";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { SvgBase64Icon } from "@/core/components/SvgBase64Icon";

export const Icon = () => {
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = useTypedFormContext();

  const {
    props: { isSystem },
  } = useCurrentDialog();

  const fieldValue = watch(QUICK_LINK_FORM_NAMES.icon.name);

  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex-1">
        <FormTextField
          {...register(QUICK_LINK_FORM_NAMES.icon.name, {
            required: "Paste the SVG code for the icon, encoded in base64 format.",
          })}
          label={"Icon(svg in base64)"}
          tooltipText="Paste the SVG code for your desired icon, encoded in base64 format. Ensure the SVG is simple, clear, and recognizable even in a small size."
          placeholder={"svg in base64"}
          control={control}
          errors={errors}
          TextFieldProps={{
            multiline: true,
            minRows: 5,
            maxRows: 5,
          }}
          disabled={isSystem}
        />
      </div>
      <div className="w-1/4">
        <SvgBase64Icon width={100} height={100} icon={fieldValue} />
      </div>
    </div>
  );
};
