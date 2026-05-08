import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  IconButton,
  Tooltip,
  Button,
  Typography,
  TextField,
  InputAdornment,
  Stack,
  Drawer,
  TablePagination,
  Snackbar,
  Box,
  Chip,
  Grid,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Slide from "@mui/material/Slide";
import { alpha } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";

import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import SaveIcon from "@mui/icons-material/Save";
import BusinessIcon from "@mui/icons-material/Business";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import SignpostIcon from "@mui/icons-material/Signpost";
import NumbersIcon from "@mui/icons-material/Numbers";
import LocationCityIcon from "@mui/icons-material/LocationCity";

import {
  allEmpresas,
  addEmpresa,
  updateEmpresa,
  deleteEmpresa,
  setEmpresa,
  setComponents,
  setAlerta,
} from "../../store/modules/empresas/actions";

import TableComponent from "../../components/Table";
import CustomDrawer from "../../components/Drawer";
import CustomDialog from "../../components/DialogAlert";
import { buscarEndereco } from "../../services/apiCep";

import {
  isValidEmail,
  isValidCep,
  maskCep,
  onlyDigits,
} from "../../utils/formValidators";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

const INITIAL_EMPRESA = {
  nome: "",
  email: "",
  telefone: "",
  endereco: {
    cep: "",
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: "",
    uf: "",
    pais: "",
  },
  geo: {
    tipo: "Point",
    coordinates: [],
  },
};

const Empresas = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const { empresas, empresa, behavior, form, components, alerta } = useSelector(
    (state) => state.empresas || {}
  );

  const [errors, setErrors] = useState({});
  const [cepLoading, setCepLoading] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");
  const [filtros, setFiltros] = useState({
    nome: "",
    email: "",
    telefone: "",
    cidade: "",
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const ultimoCepBuscadoRef = useRef("");
  const cepRequestIdRef = useRef(0);

  const originalRef = useRef(null);
  const loadedIdentityRef = useRef("");

  useEffect(() => {
    dispatch(allEmpresas());
  }, [dispatch]);

  const setComponent = (component, stateValue) => {
    dispatch(
      setComponents({
        ...components,
        [component]: stateValue,
      })
    );
  };

  const updateEmpresaField = (key, value) => {
    dispatch(
      setEmpresa({
        ...(empresa || {}),
        [key]: value,
      })
    );
  };

  const setEndereco = (patch) => {
    dispatch(
      setEmpresa({
        ...(empresa || {}),
        endereco: {
          ...(empresa?.endereco || {}),
          ...patch,
        },
      })
    );
  };

  const handleNovaEmpresa = () => {
    originalRef.current = null;
    loadedIdentityRef.current = "";
    ultimoCepBuscadoRef.current = "";
    setErrors({});
    dispatch(setEmpresa({ ...INITIAL_EMPRESA }));
    dispatch(setComponents({ ...components, behavior: "create" }));
    setComponent("drawer", true);
  };

  const handleCloseDrawer = () => {
    setErrors({});
    originalRef.current = null;
    loadedIdentityRef.current = "";
    setComponent("drawer", false);
  };

  const handleCepChange = (e) => {
    const cep = onlyDigits(e.target.value).slice(0, 8);
    setEndereco({ cep });
    setErrors((prev) => ({ ...prev, cep: "" }));

    if (cep.length < 8) {
      ultimoCepBuscadoRef.current = "";
    }
  };

  const handleCepBlur = async () => {
    const cep = onlyDigits(empresa?.endereco?.cep || "");
    if (!cep) return;

    if (!isValidCep(cep)) {
      setErrors((prev) => ({ ...prev, cep: "CEP deve conter 8 dígitos" }));
      return;
    }

    if (ultimoCepBuscadoRef.current === cep) return;
    ultimoCepBuscadoRef.current = cep;

    const requestId = ++cepRequestIdRef.current;
    setCepLoading(true);

    const endereco = await buscarEndereco(cep);

    if (requestId !== cepRequestIdRef.current) return;
    setCepLoading(false);

    if (!endereco) {
      setErrors((prev) => ({ ...prev, cep: "CEP não encontrado" }));
      return;
    }

    setErrors((prev) => ({ ...prev, cep: "" }));
    setEndereco({
      cep,
      logradouro: endereco.logradouro || "",
      bairro: endereco.bairro || "",
      cidade: endereco.localidade || "",
      uf: endereco.uf || "",
    });
  };

  const normalizeForCompare = useCallback(
    (e = {}) => ({
      nome: (e.nome || "").trim(),
      email: (e.email || "").trim().toLowerCase(),
      telefone: onlyDigits(e.telefone || ""),
      endereco: {
        cep: onlyDigits(e?.endereco?.cep || ""),
        logradouro: (e?.endereco?.logradouro || "").trim(),
        numero: String(e?.endereco?.numero ?? "").trim(),
        bairro: (e?.endereco?.bairro || "").trim(),
        cidade: (e?.endereco?.cidade || "").trim(),
        uf: (e?.endereco?.uf || "").trim(),
      },
    }),
    []
  );

  const empresaId = empresa?._id || "";

  useEffect(() => {
    if (!components?.drawer || behavior !== "update") return;
    if (!empresaId) return;

    if (loadedIdentityRef.current !== empresaId) {
      originalRef.current = normalizeForCompare(empresa);
      loadedIdentityRef.current = empresaId;
    }
  }, [components?.drawer, behavior, empresaId, empresa, normalizeForCompare]);

  const hasErrors = useMemo(
    () => Object.values(errors || {}).some((v) => Boolean(v)),
    [errors]
  );

  const requiredFilled = useMemo(() => {
    const e = empresa || {};
    return Boolean(
      (e.nome || "").trim() &&
        isValidEmail(e.email || "") &&
        onlyDigits(e?.endereco?.cep || "").length === 8 &&
        (e?.endereco?.logradouro || "").trim() &&
        String(e?.endereco?.numero ?? "").trim() &&
        (e?.endereco?.bairro || "").trim() &&
        (e?.endereco?.cidade || "").trim()
    );
  }, [empresa]);

  const hasChanges = useMemo(() => {
    if (behavior === "create") return true;
    if (!originalRef.current) return false;
    const now = normalizeForCompare(empresa || {});
    return JSON.stringify(now) !== JSON.stringify(originalRef.current);
  }, [behavior, empresa, normalizeForCompare]);

  const isSaveDisabled = useMemo(() => {
    if (loading || form?.saving || form?.filtering) return true;
    if (hasErrors) return true;

    if (behavior === "create") {
      if (!requiredFilled) return true;
      return false;
    }

    if (!hasChanges) return true;
    return false;
  }, [loading, form?.saving, form?.filtering, hasErrors, behavior, requiredFilled, hasChanges]);

  const rowsProcessadas = useMemo(() => {
    return (empresas || []).map((e, index) => ({
      ...e,
      id: index + 1,
      telefoneFormatado: e?.telefone || "-",
      cidadeFormatada: e?.endereco?.cidade || "-",
    }));
  }, [empresas]);

  const rowsFiltradas = useMemo(() => {
    const q = quickSearch.trim().toLowerCase();

    return (rowsProcessadas || []).filter((e) => {
      const matchQuick =
        !q ||
        `${e.nome || ""}`.toLowerCase().includes(q) ||
        (e.email || "").toLowerCase().includes(q) ||
        (e.telefoneFormatado || "").toLowerCase().includes(q) ||
        (e.cidadeFormatada || "").toLowerCase().includes(q);

      const matchNome =
        !filtros.nome ||
        (e.nome || "").toLowerCase().includes(filtros.nome.toLowerCase());

      const matchEmail =
        !filtros.email ||
        (e.email || "").toLowerCase().includes(filtros.email.toLowerCase());

      const matchTelefone =
        !filtros.telefone ||
        onlyDigits(e.telefoneFormatado || "").includes(onlyDigits(filtros.telefone || ""));

      const matchCidade =
        !filtros.cidade ||
        (e.cidadeFormatada || "").toLowerCase().includes(filtros.cidade.toLowerCase());

      return matchQuick && matchNome && matchEmail && matchTelefone && matchCidade;
    });
  }, [rowsProcessadas, quickSearch, filtros]);

  const rowsPaginadas = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return rowsFiltradas.slice(start, end);
  }, [rowsFiltradas, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [quickSearch, filtros, rowsPerPage]);

  const columns = [
    { field: "id", headerName: "ID", width: 10, fixed: true },
    { field: "nome", headerName: "Nome", width: 160 },
    { field: "email", headerName: "E-mail", width: 180 },
    { field: "telefoneFormatado", headerName: "Telefone", width: 140 },
    { field: "cidadeFormatada", headerName: "Cidade", width: 140 },
  ];

  const renderDetalhesEmpresa = (row) => (
    <>
      <Typography variant="h6" gutterBottom>
        🧾 Ficha da Empresa
      </Typography>
      <Typography variant="body1">
        Nome: <strong>{row.nome || "-"}</strong>
      </Typography>
      <Typography variant="body1">
        E-mail: <strong>{row.email || "-"}</strong>
      </Typography>
      <Typography variant="body1">
        Telefone: <strong>{row.telefone || "-"}</strong>
      </Typography>
      <Typography variant="body1">
        Endereço:{" "}
        <strong>
          {row?.endereco?.logradouro || "-"}, {row?.endereco?.numero || "-"} -{" "}
          {row?.endereco?.bairro || "-"}, {row?.endereco?.cidade || "-"} / {row?.endereco?.uf || "-"}
        </strong>
      </Typography>
      <Typography variant="body1">
        CEP: <strong>{row?.endereco?.cep || "-"}</strong>
      </Typography>
      {!!row?.dataCadastro && (
        <Typography variant="body1">
          Data Cadastro:{" "}
          <strong>{new Date(row.dataCadastro).toLocaleDateString("pt-BR")}</strong>
        </Typography>
      )}
    </>
  );

  const saveEmpresa = () => {
    const payload = {
      id: empresa?._id,
      data: empresa,
    };

    if (behavior === "create") {
      dispatch(addEmpresa(payload));
    } else {
      dispatch(updateEmpresa(payload));
    }
  };

  const handleClickSave = () => {
    setLoading(true);
    saveEmpresa();
    setTimeout(() => setLoading(false), 1200);
  };

  const handleOpenDialog = (selectedIds) => {
    setSelectedId(selectedIds?.[0] ?? null);
    setComponent("confirmDelete", true);
  };

  const handleCloseDialog = () => {
    setComponent("confirmDelete", false);
    setSelectedId(null);
  };

  const handleConfirmDelete = () => {
    const row = rowsProcessadas.find((r) => r.id === selectedId);
    if (!row?._id) return;
    dispatch(deleteEmpresa(row._id));
    handleCloseDialog();
  };

  const handleCloseAlerta = () => {
    dispatch(setAlerta({ ...alerta, open: false }));
  };

  const chipSx = {
    bgcolor: "rgba(2,85,93,0.25)",
    color: "#d9f7ff",
    border: "1px solid rgba(2,85,93,0.85)",
    "& .MuiChip-deleteIcon": { color: "#9fe8ff" },
    "& .MuiChip-deleteIcon:hover": { color: "#fff" },
  };

  const tableHeaderBg =
    theme.palette.mode === "dark"
      ? alpha(theme.palette.common.white, 0.08)
      : theme.palette.grey[100];

  return (
    <div className="col">
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
        {quickSearch && (
          <Chip label={`Busca: ${quickSearch}`} onDelete={() => setQuickSearch("")} sx={chipSx} />
        )}
        {filtros.nome && (
          <Chip
            label={`Nome: ${filtros.nome}`}
            onDelete={() => setFiltros((p) => ({ ...p, nome: "" }))}
            sx={chipSx}
          />
        )}
        {filtros.email && (
          <Chip
            label={`E-mail: ${filtros.email}`}
            onDelete={() => setFiltros((p) => ({ ...p, email: "" }))}
            sx={chipSx}
          />
        )}
        {filtros.telefone && (
          <Chip
            label={`Telefone: ${filtros.telefone}`}
            onDelete={() => setFiltros((p) => ({ ...p, telefone: "" }))}
            sx={chipSx}
          />
        )}
        {filtros.cidade && (
          <Chip
            label={`Cidade: ${filtros.cidade}`}
            onDelete={() => setFiltros((p) => ({ ...p, cidade: "" }))}
            sx={chipSx}
          />
        )}
      </Stack>

      <TableComponent
        loading={form?.filtering}
        title="Empresas"
        rows={rowsPaginadas}
        columns={columns}
        checkboxSelection
        renderExpandedRow={renderDetalhesEmpresa}
        onRowClick={(row) => {
          dispatch(setEmpresa(row));
          dispatch(setComponents({ ...components, behavior: "update", drawer: true }));
          setErrors({});
        }}
        tableHeaderBg={tableHeaderBg}
        toolbarComponent={(selectedIds) => (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
            <Tooltip title="Filtros avançados">
              <IconButton onClick={() => setFilterOpen(true)}>
                <FilterListIcon />
              </IconButton>
            </Tooltip>

            <TextField
              size="small"
              placeholder="Buscar..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              sx={{ minWidth: 220 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant="outlined"
              color="inherit"
              startIcon={<ClearIcon />}
              onClick={() => {
                setQuickSearch("");
                setFiltros({ nome: "", email: "", telefone: "", cidade: "" });
              }}
            >
              Limpar filtros
            </Button>

            <Button variant="contained" onClick={handleNovaEmpresa}>
              Nova empresa
            </Button>

            {selectedIds?.length > 0 && (
              <Button
                variant="contained"
                color="error"
                onClick={() => handleOpenDialog(selectedIds)}
              >
                Excluir ({selectedIds.length})
              </Button>
            )}
          </Stack>
        )}
      />

      <TablePagination
        component="div"
        rowsPerPageOptions={[5, 10, 25, 50]}
        count={rowsFiltradas.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />

      {/* Drawer de filtros avançados (mesmo padrão do Colaboradores) */}
      <Drawer anchor="right" open={filterOpen} onClose={() => setFilterOpen(false)}>
        <Box sx={{ width: 320, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Filtros avançados
          </Typography>

          <Stack spacing={2}>
            <TextField
              label="Nome"
              value={filtros.nome}
              onChange={(e) => setFiltros((p) => ({ ...p, nome: e.target.value }))}
              fullWidth
            />
            <TextField
              label="E-mail"
              value={filtros.email}
              onChange={(e) => setFiltros((p) => ({ ...p, email: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Telefone"
              value={filtros.telefone}
              onChange={(e) => setFiltros((p) => ({ ...p, telefone: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Cidade"
              value={filtros.cidade}
              onChange={(e) => setFiltros((p) => ({ ...p, cidade: e.target.value }))}
              fullWidth
            />

            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
              <Button
                variant="outlined"
                onClick={() => setFiltros({ nome: "", email: "", telefone: "", cidade: "" })}
              >
                Limpar
              </Button>
              <Button variant="contained" onClick={() => setFilterOpen(false)}>
                Aplicar
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Drawer>

      {/* Drawer de create/update */}
      <CustomDrawer
        show={components?.drawer}
        isOpen={components?.drawer}
        onClose={handleCloseDrawer}
        anchor={isMobile || isTablet ? "bottom" : "right"}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {behavior === "create" ? "Criar Nova Empresa" : "Atualizar Empresa"}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome"
                value={empresa?.nome || ""}
                onChange={(e) => updateEmpresaField("nome", e.target.value)}
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    nome: (empresa?.nome || "").trim() ? "" : "Nome é obrigatório",
                  }))
                }
                error={!!errors.nome}
                helperText={errors.nome}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="E-mail"
                value={empresa?.email || ""}
                onChange={(e) => updateEmpresaField("email", e.target.value)}
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    email: isValidEmail(empresa?.email || "") ? "" : "E-mail inválido. Ex: nome@dominio.com.br",
                  }))
                }
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailOutlineIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Telefone"
                value={empresa?.telefone || ""}
                onChange={(e) => updateEmpresaField("telefone", e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocalPhoneIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="CEP"
                value={maskCep(empresa?.endereco?.cep || "")}
                onChange={handleCepChange}
                onBlur={handleCepBlur}
                error={!!errors.cep}
                helperText={errors.cep || (cepLoading ? "Consultando CEP..." : "")}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SignpostIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Rua / Logradouro"
                value={empresa?.endereco?.logradouro || ""}
                onChange={(e) => setEndereco({ logradouro: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Número"
                value={empresa?.endereco?.numero || ""}
                onChange={(e) => setEndereco({ numero: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <NumbersIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Bairro"
                value={empresa?.endereco?.bairro || ""}
                onChange={(e) => setEndereco({ bairro: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Cidade"
                value={empresa?.endereco?.cidade || ""}
                onChange={(e) => setEndereco({ cidade: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationCityIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>

          <Button
            fullWidth
            variant="contained"
            color={behavior === "create" ? "success" : "primary"}
            startIcon={<SaveIcon />}
            sx={{ mt: 3 }}
            disabled={isSaveDisabled}
            onClick={handleClickSave}
          >
            {behavior === "create" ? "Salvar" : "Salvar alterações"}
          </Button>
        </Box>
      </CustomDrawer>

      {/* Dialog exclusão */}
      <CustomDialog
        open={components?.confirmDelete}
        title="Excluir empresa"
        description="Tem certeza que deseja excluir? Esta ação não poderá ser desfeita."
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDialog}
      />

      {/* Snackbar */}
      <Snackbar
        open={!!alerta?.open}
        autoHideDuration={5000}
        onClose={handleCloseAlerta}
        TransitionComponent={SlideTransition}
        anchorOrigin={{
          vertical: "top",
          horizontal: isMobile ? "center" : "right",
        }}
      >
        <Alert onClose={handleCloseAlerta} severity={alerta?.tipo || "info"} sx={{ width: "100%" }}>
          {alerta?.mensagem || ""}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Empresas;