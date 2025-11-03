import { Create } from "./components/Create";
import { Edit } from "./components/Edit";
import { ManageClusterSecretProps } from "./types";
import { FORM_MODES } from "@/core/types/forms";

export const ManageClusterSecret = ({ formData }: ManageClusterSecretProps) => {
  const { mode } = formData;

  return (
    <div className="flex flex-col gap-4" data-testid="form">
      <div>{mode === FORM_MODES.CREATE ? <Create formData={formData} /> : <Edit formData={formData} />}</div>
    </div>
  );
};
