import { ExposedSecret } from "@my-project/shared";

export interface ExposedSecretWithId extends ExposedSecret {
  id: string;
}
