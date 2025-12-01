import { useFormContext } from "react-hook-form";
import { CreateCodebaseFormValues } from "../names";

export const useTypedFormContext = () => useFormContext<CreateCodebaseFormValues>();
