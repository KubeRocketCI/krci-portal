import React from "react";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";

export type NameValueRow = {
  name: React.ReactNode;
  value: React.ReactNode;
};

export const NameValueTable = ({ rows }: { rows: NameValueRow[] }) => {
  if (!rows?.length) {
    return null;
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell width="45%">Name</TableCell>
            <TableCell width="55%">Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
