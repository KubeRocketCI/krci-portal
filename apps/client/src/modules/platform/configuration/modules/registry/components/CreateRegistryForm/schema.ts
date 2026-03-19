import z from "zod";
import { containerRegistryTypeEnum } from "@my-project/shared";

export const createRegistryFormSchema = z.object({
  registryType: containerRegistryTypeEnum,
  registryEndpoint: z.string().optional(),
  registrySpace: z.string().min(1, "Registry space is required"),
  awsRegion: z.string().optional(),
  irsaRoleArn: z.string().optional(),
  pushAccountUser: z.string().optional(),
  pushAccountPassword: z.string().optional(),
  pullAccountUser: z.string().min(1, "Pull account username is required"),
  pullAccountPassword: z.string().min(1, "Pull account password is required"),
  useSameAccount: z.boolean().optional(),
});

export type CreateRegistryFormValues = z.infer<typeof createRegistryFormSchema>;
