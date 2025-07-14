import { Stack, Tooltip } from "@mui/material";
import { Info } from "lucide-react";

export const IngressHeadColumn = () => {
  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="nowrap">
      <div>Ingress</div>
      <Tooltip
        title={
          "The Ingress endpoint directs you to the deployed application. To view the link, ensure your application is deployed with an Ingress resource."
        }
      >
        <Info size={16} />
      </Tooltip>
    </Stack>
  );
};
