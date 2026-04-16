import React from "react";
import {
  Box,
  Button,
  Collapse,
  Container,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  Checkbox,
  Toolbar,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Chip } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import PropTypes from "prop-types";

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  return array.slice().sort(comparator);
}

const TableComponent = ({
  title = "",
  rows = [],
  columns = [],
  buttonLabel = "",
  onButtonClick = () => {},
  onRowClick = () => {},
  height = 400,
  checkboxSelection = false,
  iconClass = "",
  toolbarComponent = null,
  renderExpandedRow = null,
}) => {
  const [expandedRowId, setExpandedRowId] = React.useState(null);
  const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState(columns[0]?.field || "");
  const [selectedIds, setSelectedIds] = React.useState([]);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // const handleSelectAll = (event) => {
  //   if (event.target.checked) {
  //     setSelectedIds(rows.map((r) => r.id));
  //   } else {
  //     setSelectedIds([]);
  //   }
  // };

  const handleRowClick = (row) => {
    setExpandedRowId((prev) => (prev === row.id ? null : row.id));
    onRowClick(row);
  };

  const theme = useTheme();

  return (
    <Container maxWidth="lg" sx={{ py: 5, backgroundColor: "inquerit" }}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Box variant="h4" component="h2" sx={{ color: "white" }}>
          {title}
        </Box>
        {buttonLabel && (
          <Button
            variant="contained"
            size="medium"
            onClick={onButtonClick}
            startIcon={iconClass ? <span className={iconClass} /> : null}
          >
            {buttonLabel}
          </Button>
        )}
      </Box>

      {toolbarComponent && (
        <Toolbar sx={{ justifyContent: "space-between", mb: 2 }}>
          {selectedIds.length > 0 ? (
            <Typography sx={{ color: "white" }}>
              {selectedIds.length} selecionado(s)
            </Typography>
          ) : (
            ""
          )}
          {toolbarComponent(selectedIds)}
        </Toolbar>
      )}

      <TableContainer
        component={Paper}
        sx={{
          maxHeight: height,
          backgroundColor:
            theme.palette.mode === "dark"
              ? "rgba(47, 50, 67, 0.5)"
              : "rgba(255, 255, 255, 0.7)", // ajuste aqui a opacidade como quiser
          backdropFilter: "blur(4px)", // opcional: efeito de vidro fosco bonito
          borderRadius: 2,
          boxShadow: theme.shadows[3],
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {<TableCell></TableCell>}
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  align={column.align || "left"}
                  sortDirection={orderBy === column.field ? order : false}
                  sx={{ fontWeight: "bold" }}
                >
                  <TableSortLabel
                    active={orderBy === column.field}
                    direction={orderBy === column.field ? order : "asc"}
                    onClick={() => handleSort(column.field)}
                  >
                    {column.headerName}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell />
            </TableRow>
          </TableHead>

          <TableBody>
            {stableSort(rows, getComparator(order, orderBy)).map((row) => (
              <React.Fragment key={row.id}>
                <TableRow
                  hover
                  sx={{
                    cursor: "pointer",
                  }}
                  selected={selectedIds.includes(row.id)}
                  key={`row-${row.id}`}
                  onClick={(e) => {
                    if (e.target.closest(`#flecha-expand-icon-btn-${row.id}`))
                      return;
                    handleRowClick(row);
                  }}
                >
                  {checkboxSelection && (
                    <TableCell padding="checkbox" key={`checkbox-${row.id}`}>
                      <Checkbox
                        checked={selectedIds.includes(row.id)}
                        onClick={(e) => {
                          e.stopPropagation(); // Impede que o clique na checkbox abra o drawer
                          handleSelectRow(row.id);
                        }}
                      />
                    </TableCell>
                  )}

                  {columns.map((col) => (
                    <TableCell
                      key={`cell-${row.id}-${col.field}`}
                      align={col.align || "left"}
                      style={{ width: col.width || "auto" }}
                    >
                      {col.field === "statusFormat" ? (
                        <Chip
                          label={row[col.field]}
                          color={
                            row[col.field] === "Ativo" ? "success" : "error"
                          }
                          size="small"
                        />
                      ) : (
                        row[col.field]
                      )}
                    </TableCell>
                  ))}

                  <TableCell align="right" key={`expand-btn-${row.id}`}>
                    <IconButton
                      size="small"
                      id={`flecha-expand-icon-btn-${row.id}`}
                      onClick={(e) => {
                        e.stopPropagation(); // Evita que o clique no botão propague
                        setExpandedRowId((prev) =>
                          prev === row.id ? null : row.id
                        );
                      }}
                    >
                      {expandedRowId === row.id ? (
                        <KeyboardArrowUpIcon />
                      ) : (
                        <KeyboardArrowDownIcon />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>

                <TableRow key={`row-expanded-${row.id}`}>
                  <TableCell
                    colSpan={columns.length + (checkboxSelection ? 2 : 1)}
                    style={{ paddingBottom: 0, paddingTop: 0 }}
                  >
                    <Collapse
                      in={expandedRowId === row.id}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box margin={2}>
                        {renderExpandedRow ? (
                          renderExpandedRow(row)
                        ) : (
                          <>
                            <Typography variant="subtitle1" gutterBottom>
                              Detalhes do Cliente
                            </Typography>
                            <Typography>
                              Nome completo: {JSON.stringify(row)}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

TableComponent.propTypes = {
  title: PropTypes.string,
  rows: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  buttonLabel: PropTypes.string,
  onButtonClick: PropTypes.func,
  onRowClick: PropTypes.func,
  height: PropTypes.number,
  checkboxSelection: PropTypes.bool,
  iconClass: PropTypes.string,
  toolbarComponent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  renderExpandedRow: PropTypes.func,
};

export default TableComponent;
