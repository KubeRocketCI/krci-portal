import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import makeStyles from "@mui/styles/makeStyles";
import Stack from "@mui/material/Stack";
import { styled } from "@mui/material/styles";
import { PieChart, Pie, Label } from "recharts";
import React from "react";
import { ErrorContent } from "../ErrorContent";
import { RequestError } from "@/core/types/global";

const useStyle = makeStyles(() => ({
  chart: {
    marginLeft: "auto",
    marginRight: "auto",
  },
}));

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export interface PercentageCircleChartProps {
  title?: string | null;
  legend?: string | React.ReactNode | null;
  total?: number;
  data: ChartDataPoint[];
  BoxSx?: object;
  error?: RequestError | null;
  size?: number;
  dataKey?: string;
  label?: string | null;
  totalProps?: Record<string, unknown>;
  thickness?: number;
}

const StyledTileChartWrapper = styled(Box)<{ error: boolean }>(({ theme, error }) => ({
  padding: theme.typography.pxToRem(24),
  boxShadow: "0px 1px 10px 0px #0024461f",
  borderLeft: `4px solid ${error ? theme.palette.error.main : theme.palette.primary.main}`,
  borderRadius: 4,
  overflow: "hidden",
  height: "100%",
  "& .recharts-sector": { stroke: "none" },
  "& .recharts-wrapper": {
    width: "100% !important",
    height: "100% !important",
    lineHeight: 0,
  },
  "& .recharts-surface": {
    width: "100%",
    height: "100%",
  },
}));

export const PercentageCircleChart = ({
  title,
  legend,
  total = 100,
  data,
  BoxSx,
  error,
  size = 200,
  dataKey = "percentage",
  label = "",
  totalProps = {},
  thickness = 16,
}: PercentageCircleChartProps) => {
  const classes = useStyle();
  const chartSize = size * 0.8;
  const isLoading = total < 0;

  const fillColor = "#1976d2";
  const strokeColor = "#e0e0e0";
  const labelColor = "#424242";

  const formatData = () => {
    let filledValue = 0;

    const formatted = data.map((item) => {
      filledValue += item.value;
      return {
        percentage: (item.value / total) * 100,
        ...item,
      };
    });

    const remaining = {
      name: "total",
      percentage: total === 0 ? 100 : ((total - filledValue) / total) * 100,
      value: total,
      fill: strokeColor,
      ...totalProps,
    };

    return [...formatted, remaining];
  };

  return (
    <StyledTileChartWrapper error={!!error}>
      <Stack>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h6" color="primary.dark">
            {title}
          </Typography>
        </Stack>
        {error ? (
          <ErrorContent error={error} orientation="vertical" />
        ) : (
          <Stack direction="row" spacing={2}>
            <Box sx={BoxSx}>
              <Box aria-busy={isLoading} aria-live="polite" justifyContent="center" alignItems="center" mx="auto">
                <PieChart
                  cx={size / 2}
                  cy={size / 2}
                  width={chartSize}
                  height={chartSize}
                  className={classes.chart}
                  margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                >
                  <Pie
                    data={formatData()}
                    cx={chartSize / 2}
                    cy={chartSize / 2}
                    innerRadius={chartSize * 0.47 - thickness}
                    outerRadius={chartSize * 0.47}
                    dataKey={dataKey}
                    startAngle={90}
                    endAngle={-270}
                    stroke={strokeColor}
                    fill={fillColor}
                  >
                    <Label
                      value={label || ""}
                      position="center"
                      style={{
                        fontSize: `${chartSize * 0.15}px`,
                        fill: labelColor,
                      }}
                    />
                  </Pie>
                </PieChart>
                {!isLoading && typeof legend === "string" && (
                  <Typography align="center" fontSize="1.1em" fontWeight="normal">
                    {legend}
                  </Typography>
                )}
              </Box>
            </Box>
            {legend && typeof legend !== "string" && <Box sx={{ pt: "16px" }}>{legend}</Box>}
          </Stack>
        )}
      </Stack>
    </StyledTileChartWrapper>
  );
};
