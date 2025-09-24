import { RequestError } from "@/core/types/global";

export const getForbiddenError = (error: RequestError): RequestError | null => {
  if (error?.data?.httpStatus === 403) {
    return error;
  }
  return null;
};
