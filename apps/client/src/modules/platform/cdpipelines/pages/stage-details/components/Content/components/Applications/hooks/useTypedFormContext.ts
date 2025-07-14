import { useFormContext } from "react-hook-form";
import { ApplicationsFormValues } from "../types";

export const useTypedFormContext = () => {
  return useFormContext<ApplicationsFormValues>();
};
