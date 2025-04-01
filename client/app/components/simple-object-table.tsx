import { SxProps, Table, TableBody, TableCell, TableRow } from "@mui/material";

interface SimpleObjectTableProps {
  object: any | null;
  sx?: SxProps;
}
export const SimpleObjectTable: React.FC<SimpleObjectTableProps> = ({
  object,
  sx,
}) => {
  return (
    object && (
      <Table sx={sx || { mb: 2 }} size="small">
        <TableBody>
          {Object.keys(object).map((key: string) => (
            <TableRow key={key}>
              <TableCell variant="head" style={{ textAlign: "left" }}>
                {key}
              </TableCell>
              <TableCell variant="body" style={{ textAlign: "center" }}>
                {Array.isArray(object[key])
                  ? JSON.stringify(object[key])
                  : object[key]}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  );
};
