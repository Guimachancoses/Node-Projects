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
  Stack,
  Card,
  CardContent,
  Chip,
  Divider,
  useMediaQuery,
  CircularProgress,
  useTheme
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import PropTypes from "prop-types";

function descendingComparator(a, b, orderBy) {
  if (b?.[orderBy] < a?.[orderBy]) return -1;
  if (b?.[orderBy] > a?.[orderBy]) return 1;
  return 0;
}
function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}
function stableSort(array, comparator) {
  return (array || []).slice().sort(comparator);
}

const TableComponent = ({
  title = "",
  rows = [],
  columns = [],
  buttonLabel = "",
  onButtonClick = () => { },
  onRowClick = () => { },
  height = 520,
  checkboxSelection = false,
  iconClass = "",
  toolbarComponent = null,
  renderExpandedRow = null,
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDark = theme.palette.mode === "dark"

  const [expandedRowId, setExpandedRowId] = React.useState(null);
  const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState(columns[0]?.field || "");
  const [selectedIds, setSelectedIds] = React.useState([]);

  const sortedRows = stableSort(rows, getComparator(order, orderBy));

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

  const renderCellValue = (row, col) => {
    if (col.field === "statusFormat") {
      return (
        <Chip
          label={row[col.field]}
          color={row[col.field] === "Ativo" ? "success" : "error"}
          size="small"
        />
      );
    }
    if (col.field === "chatbotStatus") {
      return row[col.field] ? <Chip label="ChatBot" color="success" size="small" /> : "-";
    }
    return row[col.field] ?? "-";
  };

  return (
    <Container maxWidth={false} sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        gap={1.5}
        mb={2}
      >
        <Typography variant="h5" sx={{ color: isDark ? "#fff" : "var(--primary-light)", fontWeight: 700 }}>
          {title}
        </Typography>

        {!!buttonLabel && (
          <Button
            variant="contained"
            onClick={onButtonClick}
            fullWidth={isMobile}
            startIcon={iconClass ? <span className={iconClass} /> : null}
            sx={{ textTransform: "none", minHeight: 40, fontWeight: 600 }}
          >
            {buttonLabel}
          </Button>
        )}
      </Stack>

      <Toolbar sx={{ justifyContent: "space-between", px: 0, mb: 1 }}>
        <Box />
        {toolbarComponent(selectedIds)}
      </Toolbar>


      {loading ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress />
        </Paper>
      ) : isMobile ? (
        <Stack spacing={1.2}>
          {sortedRows.map((row) => (
            <Card
              key={row.id}
              sx={{
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(47,50,67,.6)"
                    : "rgba(255,255,255,.9)",
                backdropFilter: "blur(4px)",
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ pb: "12px !important" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" fontWeight={700}>
                    {[row.nome, row.sobrenome].filter(Boolean).join(" ") || `${row.titulo}` || `#${row.id}`}
                  </Typography>

                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {checkboxSelection && (
                      <Checkbox
                        checked={selectedIds.includes(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                      />
                    )}
                    <IconButton
                      size="small"
                      onClick={() =>
                        setExpandedRowId((prev) => (prev === row.id ? null : row.id))
                      }
                    >
                      {expandedRowId === row.id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 1 }} />

                {columns.slice(0, 3).map((col) => (
                  <Typography key={`${row.id}-${col.field}`} variant="body2" sx={{ mb: 0.4 }}>
                    <strong>{col.headerName}:</strong> {renderCellValue(row, col)}
                  </Typography>
                ))}

                <Button
                  size="small"
                  sx={{ mt: 1, textTransform: "none" }}
                  onClick={() => onRowClick(row)}
                >
                  Ver / Editar
                </Button>

                <Collapse in={expandedRowId === row.id} timeout="auto" unmountOnExit>
                  <Box mt={1.2}>
                    {renderExpandedRow ? (
                      renderExpandedRow(row)
                    ) : (
                      <Typography variant="body2">Detalhes: {JSON.stringify(row)}</Typography>
                    )}
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            maxHeight: height,
            overflowX: "auto",
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(47, 50, 67, 0.5)"
                : "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(4px)",
            borderRadius: 2,
            boxShadow: theme.shadows[3],
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell />
                {columns.map((column) => (
                  <TableCell
                    key={column.field}
                    align={column.align || "left"}
                    sortDirection={orderBy === column.field ? order : false}
                    sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}
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
              {sortedRows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow
                    hover
                    selected={selectedIds.includes(row.id)}
                    sx={{ cursor: "pointer" }}
                    onClick={() => onRowClick(row)}
                  >
                    {checkboxSelection && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(row.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRow(row.id);
                          }}
                        />
                      </TableCell>
                    )}

                    {columns.map((col) => (
                      <TableCell key={`${row.id}-${col.field}`} sx={{ whiteSpace: "nowrap" }}>
                        {renderCellValue(row, col)}
                      </TableCell>
                    ))}

                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedRowId((prev) => (prev === row.id ? null : row.id));
                        }}
                      >
                        {expandedRowId === row.id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell colSpan={columns.length + (checkboxSelection ? 2 : 1)} sx={{ py: 0 }}>
                      <Collapse in={expandedRowId === row.id} timeout="auto" unmountOnExit>
                        <Box m={2}>
                          {renderExpandedRow ? (
                            renderExpandedRow(row)
                          ) : (
                            <Typography>Detalhes: {JSON.stringify(row)}</Typography>
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
      )}
      {toolbarComponent && (
        <Toolbar sx={{ justifyContent: "space-between", px: 0, mb: 1 }}>
          {selectedIds.length > 0 ? (
            <Typography sx={{ color: "white" }}>{selectedIds.length} selecionado(s)</Typography>
          ) : (
            <Box />
          )}
        </Toolbar>
      )}
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
  loading: PropTypes.bool,
};

export default TableComponent;