import { Table, TableBody, TableCell, TableRow } from "@mui/material";

interface SimpleObjectTableProps {
  object: any | null;
}
export const SimpleObjectTable: React.FC<SimpleObjectTableProps> = ({
  object,
}) => {
  return (
    object && (
      <Table>
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
