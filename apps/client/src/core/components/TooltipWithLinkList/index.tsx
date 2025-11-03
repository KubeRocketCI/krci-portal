import { Link, MenuItem, MenuList, Paper, Tooltip } from "@mui/material";
import { ChevronDown, SquareArrowOutUpRight } from "lucide-react";

export const TooltipWithLinkList = ({ urls, size }: { urls: string[]; size?: "medium" | "small" }) => {
  const iconSize = size === "medium" ? 20 : 15;

  return (
    <Tooltip
      title={
        <Paper elevation={8}>
          <MenuList
            sx={{
              maxHeight: "40vh",
              overflowY: "auto",
            }}
          >
            {urls.map((el) => (
              <MenuItem
                key={el}
                component={Link}
                href={el}
                target={"_blank"}
                sx={{ whiteSpace: "normal", wordBreak: "break-word" }}
              >
                {el}
              </MenuItem>
            ))}
          </MenuList>
        </Paper>
      }
      PopperProps={{
        sx: {
          "& .MuiTooltip-tooltip": { p: "0 !important" },
        },
        placement: "top-end",
      }}
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
