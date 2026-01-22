import { Tooltip } from "@/core/components/ui/tooltip";
import { ChevronDown, SquareArrowOutUpRight } from "lucide-react";

export const TooltipWithLinkList = ({ urls, size }: { urls: string[]; size?: "medium" | "small" }) => {
  const iconSize = size === "medium" ? 20 : 15;

  return (
    <Tooltip
      title={
        <div className="bg-card max-h-[40vh] overflow-y-auto rounded p-0 shadow-lg">
          <div className="flex flex-col">
            {urls.map((el) => (
              <a
                key={el}
                href={el}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-accent rounded-sm px-2 py-1.5 text-sm break-words whitespace-normal"
              >
                {el}
              </a>
            ))}
          </div>
        </div>
      }
      placement="top"
    >
      <div className="mx-8 leading-none">
        <div className="flex flex-row items-center">
          <SquareArrowOutUpRight className="text-muted-foreground/70" size={iconSize} />
          <ChevronDown size={iconSize} />
        </div>
      </div>
    </Tooltip>
  );
};
