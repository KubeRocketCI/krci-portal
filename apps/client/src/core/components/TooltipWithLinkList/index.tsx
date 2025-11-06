import { Tooltip } from "@/core/components/ui/tooltip";
import { ChevronDown, SquareArrowOutUpRight } from "lucide-react";

export const TooltipWithLinkList = ({ urls, size }: { urls: string[]; size?: "medium" | "small" }) => {
  const iconSize = size === "medium" ? 20 : 15;

  return (
    <Tooltip
      title={
        <div className="bg-card rounded shadow-lg p-0 max-h-[40vh] overflow-y-auto">
          <div className="flex flex-col">
            {urls.map((el) => (
              <a
                key={el}
                href={el}
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-normal break-words px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
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
          <SquareArrowOutUpRight size={iconSize} />
          <ChevronDown size={iconSize} />
        </div>
      </div>
    </Tooltip>
  );
};
