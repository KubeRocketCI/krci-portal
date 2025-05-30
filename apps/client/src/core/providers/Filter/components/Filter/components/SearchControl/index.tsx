import { useFilterContext } from "@/core/providers/Filter/hooks";
import { InputAdornment, TextField } from "@mui/material";
import { Search } from "lucide-react";
import React from "react";

export const SearchControl = () => {
  const { filter, setFilterItem } = useFilterContext<unknown, "search">();
  const [shrink, setShrink] = React.useState(!!filter.values.search || false);

  return (
    <TextField
      sx={{
        "& .MuiInputLabel-root:not(.MuiInputLabel-shrink)": {
          transform: "translate(30px, 20px)",
        },
      }}
      fullWidth
      id="standard-search"
      label={"Search"}
      type="search"
      value={filter.values.search || ""}
      onFocus={() => setShrink(true)}
      onBlur={(e) => {
        if (!e.target.value) {
          setShrink(false);
        }
      }}
      InputLabelProps={{
        shrink: shrink,
      }}
      InputProps={{
        role: "search",
        startAdornment: (
          <InputAdornment position="start">
            <Search size={16} />
          </InputAdornment>
        ),
      }}
      placeholder={"Search"}
      onChange={(event) => {
        setFilterItem("search", event.target.value);
      }}
    />
  );
};
