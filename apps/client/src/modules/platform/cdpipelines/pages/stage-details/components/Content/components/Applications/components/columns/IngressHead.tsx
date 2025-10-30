import { Tooltip } from "@mui/material";
import { Info } from "lucide-react";

export const IngressHeadColumn = () => {
  return (
    <div className="flex flex-row gap-2 items-center flex-nowrap">
      <div>Ingress</div>
      <Tooltip
        title={
          "The Ingress endpoint directs you to the deployed application. To view the link, ensure your application is deployed with an Ingress resource."
        }
      >
        <Info size={16} />
      </Tooltip>
    </div>
  );
};
