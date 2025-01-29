import {
  Grid2,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@mui/material";

interface CCell {
  a: number;
  b: number;
  c: number;
  alpha: number;
  beta: number;
  gamma: number;
}

interface CResolutionRange {
  low: number;
  high: number;
}
interface CObsData {
  cell?: CCell;
  spaceGroup?: string;
  resolutionRange?: CResolutionRange;
}

interface BaseSpacegroupCellElementProps {
  data?: CObsData;
}

export const BaseSpacegroupCellElement: React.FC<
  BaseSpacegroupCellElementProps
> = (props) => {
  return props.data?.cell ? (
    <Stack direction="column">
      <Table>
        <TableBody>
          <TableRow>
            <TableCell variant="head">Spacegroup</TableCell>
            <TableCell
              variant="body"
              key="Spacegroup"
              colSpan={6}
              sx={{ textAlign: "justify" }}
            >
              {typeof props.data?.spaceGroup === "string"
                ? JSON.stringify(props.data?.spaceGroup)
                : "?"}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell variant="head">Cell</TableCell>
            {Object.keys(props.data.cell).map((key: string) => (
              <TableCell variant="body" key={key}>
                {key}=
                {props.data?.cell && props.data?.cell[key]?.toPrecision
                  ? props.data.cell[key].toPrecision(4)
                  : "?"}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell variant="head">Resolution</TableCell>
            <TableCell variant="body" key="low">
              {props.data?.resolutionRange?.low?.toPrecision
                ? props.data.resolutionRange.low.toPrecision(4)
                : "?"}
            </TableCell>
            <TableCell variant="body" key="high">
              {props.data?.resolutionRange?.high?.toPrecision
                ? props.data.resolutionRange.high.toPrecision(4)
                : "?"}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Stack>
  ) : (
    <div></div>
  );
};
