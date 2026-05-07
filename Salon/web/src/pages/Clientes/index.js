import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";

import {
  IconButton,
  Tooltip,
  Button,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  useTheme,
  useMediaQuery,
  Box,
  Chip,
  Stack,
  Drawer,
  TablePagination
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Slide from "@mui/material/Slide";
import { alpha } from "@mui/material/styles";


import { useDispatch, useSelector } from "react-redux";

import {
  allClientes,
  updateCliente,
  filterClientes,
  addCliente,
  setAlerta,
  unlinkCliente,
} from "../../store/modules/cliente/actions";

// components
import TableComponent from "../../components/Table";
import CustomDrawer from "../../components/Drawer";
import CustomDialog from "../../components/DialogAlert";

// icons
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import RecentActorsIcon from "@mui/icons-material/RecentActors";
import FilterListIcon from "@mui/icons-material/FilterList";
import SaveIcon from "@mui/icons-material/Save";
import SignpostIcon from "@mui/icons-material/Signpost";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

import { buscarEndereco } from "../../services/apiCep";

import {
  isValidEmail,
  isValidName,
  isValidSobreName,
  isValidPhone9,
  isValidCep,
  isValidCpf,
  isValidCnpj,
  maskArea,
  maskPhone9,
  maskCep,
  maskCpf,
  maskCnpj,
  onlyDigits,
} from "../../utils/formValidators";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

const Clientes = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const { cliente, clientes, behavior, form, components } = useSelector(
    (state) => state.cliente
  );

  const alerta = useSelector((state) => state.cliente.alerta);

  const [errors, setErrors] = useState({});
  const [cepLoading, setCepLoading] = useState(false);
  const ultimoCepBuscadoRef = useRef("");
  const cepRequestIdRef = useRef(0);

  const originalRef = useRef(null);
  const loadedIdentityRef = useRef("");

  const [filterOpen, setFilterOpen] = useState(false);

  const [quickSearch, setQuickSearch] = useState("");
  const [filtros, setFiltros] = useState({
    nome: "",
    email: "",
    telefone: "",
    chatbotStatus: "", // "", "com", "sem"
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const setTelefoneField = (key, value) => {
    setCliente("telefone", {
      ...cliente.telefone,
      [key]: onlyDigits(value),
    });
  };

  const setEndereco = (patch) => {
    setCliente("endereco", {
      ...cliente.endereco,
      ...patch,
      cidade: { ...cliente.endereco?.cidade, ...(patch.cidade || {}) },
    });
  };

  const setIdentificacaoField = (key, value) => {
    setCliente("identificacao", {
      ...cliente.identificacao,
      [key]: key === "numero" ? onlyDigits(value) : value,
    });
  };

  const handleCepChange = (e) => {
    const cep = onlyDigits(e.target.value).slice(0, 8);
    setEndereco({ cep });
    setErrors((p) => ({ ...p, cep: "" }));
    if (cep.length < 8) ultimoCepBuscadoRef.current = "";
  };

  const handleCepBlur = async () => {
    const cep = onlyDigits(cliente?.endereco?.cep || "");
    if (!cep) return;

    if (!isValidCep(cep)) {
      setErrors((p) => ({ ...p, cep: "CEP deve conter 8 dígitos" }));
      return;
    }

    if (ultimoCepBuscadoRef.current === cep) return;
    ultimoCepBuscadoRef.current = cep;

    const reqId = ++cepRequestIdRef.current;
    setCepLoading(true);
    const endereco = await buscarEndereco(cep);
    if (reqId !== cepRequestIdRef.current) return;
    setCepLoading(false);

    if (!endereco) {
      setErrors((p) => ({ ...p, cep: "CEP não encontrado" }));
      return;
    }

    setErrors((p) => ({ ...p, cep: "" }));
    setEndereco({
      cep,
      logradouro: endereco.logradouro || "",
      bairro: endereco.bairro || "",
      cidade: { nome: endereco.localidade || "" },
    });
  };

  const handleClose = () => {
    dispatch(setAlerta({ ...alerta, open: false }));
  };

  useEffect(() => {
    dispatch(allClientes());
  }, [dispatch]);

  const setComponent = (component, state) => {
    dispatch(
      updateCliente({
        components: { ...components, [component]: state },
      })
    );
  };

  const setCliente = (key, value) => {
    dispatch(
      updateCliente({
        cliente: { ...cliente, [key]: value },
      })
    );
  };

  const handleNovoCliente = () => {
    dispatch(
      updateCliente({
        behavior: "create",
        form: { disabled: true },
        cliente: {
          nome: "",
          sobrenome: "",
          email: "",
          telefone: {
            area: "",
            numero: "",
          },
          identificacao: { tipoD: "", numero: "" },
          endereco: {
            cidade: { nome: "" },
            cep: "",
            logradouro: "",
            numero: null,
          },
          // Adicione outros campos que você usa no formulário aqui, se houver
        },
      })
    );
    setComponent("drawer", true);
    //console.log("Criar novo cliente");
  };

  const clientesProcessados = clientes.map((cliente, index) => {
    const telefone = cliente.telefone;
    let telefoneFormatado = "Telefone inválido";

    if (telefone && telefone.area && telefone.numero) {
      const numero = String(telefone.numero || "");
      telefoneFormatado = `(${numero.substring(0, 2)}) ${numero.substring(2, 7)}-${numero.substring(7)}`;
    }

    const chatbotStatus = cliente?.idChatBot ? "ChatBot" : "";

    return {
      ...cliente,
      telefoneFormatado,
      chatbotStatus,
      id: index + 1,
      selectedIx: cliente._id,
    };
  });

  const rowsFiltradas = useMemo(() => {
    const q = quickSearch.trim().toLowerCase();

    return (clientesProcessados || []).filter((c) => {
      // busca rápida
      const matchQuick =
        !q ||
        `${c.nome || ""} ${c.sobrenome || ""}`.toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.telefoneFormatado || "").toLowerCase().includes(q);

      // filtros avançados
      const matchNome =
        !filtros.nome ||
        `${c.nome || ""} ${c.sobrenome || ""}`
          .toLowerCase()
          .includes(filtros.nome.toLowerCase());

      const matchEmail =
        !filtros.email || (c.email || "").toLowerCase().includes(filtros.email.toLowerCase());

      const matchTelefone =
        !filtros.telefone ||
        (c.telefoneFormatado || "").replace(/\D/g, "").includes(filtros.telefone.replace(/\D/g, ""));

      const hasChatbot = !!c.idChatBot || (c.chatbotStatus || "").toLowerCase().includes("chat");
      const matchChatbot =
        !filtros.chatbotStatus ||
        (filtros.chatbotStatus === "com" ? hasChatbot : !hasChatbot);

      return matchQuick && matchNome && matchEmail && matchTelefone && matchChatbot;
    });
  }, [clientesProcessados, quickSearch, filtros]);

  const rowsPaginadas = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return rowsFiltradas.slice(start, end);
  }, [rowsFiltradas, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [quickSearch, filtros, rowsPerPage]);

  // mesma ideia de cor do cabeçalho (ajuste se seu header tiver outra regra)
  const tableHeaderBg =
    theme.palette.mode === "dark"
      ? alpha(theme.palette.common.white, 0.08)
      : theme.palette.grey[100];

  const columns = [
    { field: "id", headerName: "ID", width: 10, fixed: true },
    { field: "nome", headerName: "Nome", width: 100 },
    { field: "sobrenome", headerName: "Sobrenome", width: 100 },
    { field: "email", headerName: "E-mail", width: 150 },
    { field: "telefoneFormatado", headerName: "Telefone", width: 150 },
    { field: "chatbotStatus", headerName: "Whatsapp", width: 120 },
  ];

  const renderDetalhesCliente = (row) => (
    <>
      <Typography variant="h6" gutterBottom>
        🧾 Ficha do Cliente
      </Typography>
      <Typography variant="body1">
        Nome: <strong>{row.nome}</strong>
      </Typography>
      <Typography variant="body1">
        Sobrenome: <strong>{row.sobrenome}</strong>
      </Typography>
      <Typography variant="body1">
        E-mail: <strong>{row.email}</strong>
      </Typography>
      <Typography variant="body1">
        Data Nascimento:{" "}
        <strong>
          {new Date(row.dataNascimento).toLocaleDateString("pt-BR")}
        </strong>
      </Typography>
      <Typography variant="body1">
        Data Cadastro:{" "}
        <strong>
          {new Date(row.dataCadastro).toLocaleDateString("pt-BR")}
        </strong>
      </Typography>
    </>
  );

  const saveCli = () => {
    dispatch(addCliente());
    //console.log("Clicou em salvar");
  };

  const removeCli = (vinculoId) => {
    dispatch(unlinkCliente(vinculoId));
  };

  const [loading, setLoading] = React.useState(false);

  const handleClickSave = () => {
    setLoading(true);
    saveCli();
    // Simula uma requisição assíncrona
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  const [selectedId, setSelectedId] = useState(null);
  const [, setSelectedToDelete] = useState([]);

  const handleOpenDialog = (selectedIds) => {
    setSelectedId(selectedIds[0]);
    setComponent("confirmDelete", true);
  };

  const handleCloseDialog = () => {
    setComponent("confirmDelete", false);
    setSelectedToDelete([]);
  };

  const debounceEmailRef = useRef(null);
  const ultimoEmailVerificadoRef = useRef("");

  const validarFormatoEmail = (value = "") => /\S+@\S+\.\S+/.test(value);

  const verificarEmailCliente = (rawEmail, { force = false } = {}) => {
    if (behavior !== "create") return;

    const emailNormalizado = (rawEmail || "").trim().toLowerCase();
    if (!emailNormalizado || !validarFormatoEmail(emailNormalizado)) return;

    if (!force && ultimoEmailVerificadoRef.current === emailNormalizado) return;
    ultimoEmailVerificadoRef.current = emailNormalizado;

    dispatch(
      filterClientes({
        filters: {
          email: emailNormalizado,
          salaoId: process.env.REACT_APP_SALAO_ID,
        },
      })
    );
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setCliente("email", value);

    if (!value?.trim()) {
      ultimoEmailVerificadoRef.current = "";
      return;
    }

    if (debounceEmailRef.current) clearTimeout(debounceEmailRef.current);
    debounceEmailRef.current = setTimeout(() => {
      verificarEmailCliente(value);
    }, 500);
  };

  const handleEmailBlur = () => {
    if (debounceEmailRef.current) clearTimeout(debounceEmailRef.current);
    verificarEmailCliente(cliente?.email || "", { force: true });
    setErrors((p) => ({
      ...p,
      email: isValidEmail(cliente?.email) ? "" : "E-mail inválido. Ex: nome@dominio.com.br",
    }));
  };

  const handleEmailKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "Tab") {
      if (e.key === "Enter") e.preventDefault();
      if (debounceEmailRef.current) clearTimeout(debounceEmailRef.current);
      verificarEmailCliente(cliente?.email || "", { force: true });
    }
  };

  useEffect(() => {
    return () => {
      if (debounceEmailRef.current) clearTimeout(debounceEmailRef.current);
    };
  }, []);

  const handleCloseDrawer = () => {
    setErrors({});
    setFilterOpen(false);
    originalRef.current = null;
    loadedIdentityRef.current = "";
    setComponent("drawer", false);
  };

  const normalizeForCompare = useCallback((c = {}) => ({
    nome: (c.nome || "").trim(),
    sobrenome: (c.sobrenome || "").trim(),
    email: (c.email || "").trim().toLowerCase(),
    telefone: {
      area: onlyDigits(c?.telefone?.area || ""),
      numero: onlyDigits(c?.telefone?.numero || ""),
    },
    identificacao: {
      tipoD: c?.identificacao?.tipoD || "",
      numero: onlyDigits(c?.identificacao?.numero || ""),
    },
    endereco: {
      cep: onlyDigits(c?.endereco?.cep || ""),
      logradouro: (c?.endereco?.logradouro || "").trim(),
      numero: String(c?.endereco?.numero ?? "").trim(),
      bairro: (c?.endereco?.bairro || "").trim(),
      cidade: { nome: (c?.endereco?.cidade?.nome || "").trim() },
    },
  }), []);

  useEffect(() => {
    if (!components.drawer || behavior !== "update") return;

    const identity = `${cliente?._id || ""}-${cliente?.vinculoId || ""}`;
    if (!identity) return;

    if (loadedIdentityRef.current !== identity) {
      originalRef.current = normalizeForCompare(cliente);
      loadedIdentityRef.current = identity;
    }
  }, [components.drawer, behavior, cliente, normalizeForCompare]);

  const hasErrors = Object.values(errors || {}).some(Boolean);

  const requiredFilled = Boolean(
    (cliente?.email || "").trim() &&
    (cliente?.nome || "").trim() &&
    (cliente?.sobrenome || "").trim() &&
    onlyDigits(cliente?.telefone?.area || "").length === 2 &&
    onlyDigits(cliente?.telefone?.numero || "").length === 9 &&
    onlyDigits(cliente?.endereco?.cep || "").length === 8 &&
    (cliente?.endereco?.logradouro || "").trim() &&
    String(cliente?.endereco?.numero ?? "").trim() &&
    (cliente?.endereco?.bairro || "").trim() &&
    (cliente?.endereco?.cidade?.nome || "").trim() &&
    (cliente?.identificacao?.tipoD || "").trim() &&
    (cliente?.identificacao?.numero || "").trim()
  );

  const hasChanges = useMemo(() => {
    if (behavior === "create") return true;
    if (!originalRef.current) return false; // <- importante
    return (
      JSON.stringify(normalizeForCompare(cliente)) !==
      JSON.stringify(originalRef.current)
    );
  }, [behavior, cliente, normalizeForCompare]);

  const isSaveDisabled = useMemo(() => {
    if (loading || form?.saving || form?.filtering) return true;
    if (hasErrors) return true;

    if (behavior === "create") {
      return !requiredFilled;
    }

    // update
    return !hasChanges;
  }, [loading, form?.saving, form?.filtering, hasErrors, behavior, requiredFilled, hasChanges]);

  const isReativar = behavior !== "create" && cliente?.vinculo === "E";

  const chipSx = {
    bgcolor: "rgba(2,85,93,0.25)",
    color: "#d9f7ff",
    border: "1px solid rgba(2,85,93,0.85)",
    "& .MuiChip-deleteIcon": { color: "#9fe8ff" },
    "& .MuiChip-deleteIcon:hover": { color: "#fff" },
  };

  //console.log("clientes", clientes)

  return (
    <div className="col">
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
        {quickSearch && (
          <Chip label={`Busca: ${quickSearch}`} onDelete={() => setQuickSearch("")} sx={chipSx} />
        )}
        {filtros.nome && (
          <Chip label={`Nome: ${filtros.nome}`} onDelete={() => setFiltros((p) => ({ ...p, nome: "" }))} sx={chipSx} />
        )}
        {filtros.email && (
          <Chip label={`E-mail: ${filtros.email}`} onDelete={() => setFiltros((p) => ({ ...p, email: "" }))} sx={chipSx} />
        )}
        {filtros.telefone && (
          <Chip label={`Telefone: ${filtros.telefone}`} onDelete={() => setFiltros((p) => ({ ...p, telefone: "" }))} sx={chipSx} />
        )}
        {filtros.chatbotStatus && (
          <Chip
            label={`WhatsApp: ${filtros.chatbotStatus === "com" ? "Com ChatBot" : "Sem ChatBot"}`}
            onDelete={() => setFiltros((p) => ({ ...p, chatbotStatus: "" }))}
            sx={chipSx}
          />
        )}
      </Stack>
      <TableComponent
        loading={form.filtering}
        title="Clientes"
        rows={rowsPaginadas}
        columns={columns}
        buttonLabel="Novo Cliente"
        iconClass="mdi mdi-plus"
        onButtonClick={handleNovoCliente}
        toolbarComponent={(selectedIds) => (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{ width: "100%" }}
          >
            <Tooltip title="Filtros avançados">
              <IconButton onClick={() => setFilterOpen(true)}>
                <FilterListIcon sx={{ color: "#fff" }} />
              </IconButton>
            </Tooltip>
            <TextField
              size="small"
              placeholder="Pesquisar ..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon
                    fontSize="small"
                    style={{ marginRight: 8, opacity: 0.85, color: "#fff" }}
                  />
                ),
              }}
              sx={{
                minWidth: { xs: "100%", sm: 320 },
                "& .MuiOutlinedInput-root": {
                  color: "#fff",
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.14)", // borda padrão
                  },
                  "&:hover fieldset": {
                    borderColor: "primary.main", // hover
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main", // foco
                  },
                },
                "& .MuiInputBase-input::placeholder": {
                  color: "rgba(255,255,255,0.9)",
                  opacity: 1,
                },
              }}
            />

            <Button
              sx={{ color: "#fff" }}
              variant="outlined"
              startIcon={<ClearIcon sx={{ color: "#fff" }} />}
              onClick={() => {
                setQuickSearch("");
                setFiltros({ nome: "", email: "", telefone: "", chatbotStatus: "" });
              }}
            >
              Limpar filtros
            </Button>

            <Button
              variant="outlined"
              color="error"
              disabled={selectedIds.length === 0}
              onClick={() => handleOpenDialog(selectedIds)}
              sx={{ ml: { sm: "auto" } }}
            >
              Excluir {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
            </Button>
          </Stack>
        )}
        onRowClick={(cliente) => {
          dispatch(
            updateCliente({
              behavior: "update",
              cliente,
              form: {
                ...cliente.form,
                disabled: false, // <- ativa edição manualmente aqui
              },
            })
          );
          setComponent("drawer", true);
        }}
        checkboxSelection={true}
        renderExpandedRow={renderDetalhesCliente}
      />
      <Box sx={{ mr: 3, display: "flex", justifyContent: "flex-end" }}>
        <Box
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: tableHeaderBg,
            border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            backdropFilter: "blur(2px)",
            width: "fit-content", // fica compacta
          }}
        >
          <TablePagination
            component="div"
            count={rowsFiltradas.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Linhas por página"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            sx={{
              color: "text.primary",
              "& .MuiTablePagination-toolbar": {
                minHeight: 38,       // menor altura
                px: 1,
                gap: 1,
              },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                m: 0,
                fontSize: "0.8rem",
              },
              "& .MuiTablePagination-select": {
                fontSize: "0.8rem",
              },
              "& .MuiIconButton-root": {
                p: 0.5,              // botões menores
                color: "text.primary",
              },
              "& .MuiSvgIcon-root": {
                fontSize: "1rem",
              },
            }}
          />
        </Box>
      </Box>

      <Drawer anchor="right" open={filterOpen} onClose={() => setFilterOpen(false)}>
        <Box sx={{ width: 320, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Filtros avançados</Typography>

          <TextField
            fullWidth
            label="Nome"
            margin="normal"
            value={filtros.nome}
            onChange={(e) => setFiltros((p) => ({ ...p, nome: e.target.value }))}
          />
          <TextField
            fullWidth
            label="E-mail"
            margin="normal"
            value={filtros.email}
            onChange={(e) => setFiltros((p) => ({ ...p, email: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Telefone"
            margin="normal"
            value={filtros.telefone}
            onChange={(e) => setFiltros((p) => ({ ...p, telefone: e.target.value }))}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Status WhatsApp</InputLabel>
            <Select
              label="Status WhatsApp"
              value={filtros.chatbotStatus}
              onChange={(e) => setFiltros((p) => ({ ...p, chatbotStatus: e.target.value }))}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="com">Com ChatBot</MenuItem>
              <MenuItem value="sem">Sem ChatBot</MenuItem>
            </Select>
          </FormControl>

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setFiltros({ nome: "", email: "", telefone: "", chatbotStatus: "" })}
            >
              Limpar
            </Button>
            <Button fullWidth variant="contained" onClick={() => setFilterOpen(false)}>
              Aplicar
            </Button>
          </Stack>
        </Box>
      </Drawer>
      {/* Drawer Component Controlado diretamente pelo estado do Redux */}
      <div
        style={{ display: "flex", flexDirection: "column", marginLeft: "16px" }}
      >
        <CustomDrawer
          show={components.drawer}
          anchor={isMobile || isTablet ? "bottom" : "right"}
          isOpen={components.drawer}
          onClose={handleCloseDrawer}
        >
          <div className="col-12">
            <h3>
              {behavior === "create" ? "Criar Novo" : "Atualizar"} Cliente
            </h3>
            {/* Aqui você pode adicionar inputs, formulários, etc */}
            <p>Verifique as informações antes de salvar:</p>
            <div className="row mt-3">
              <div className="form-group col-12 mb-3">
                <TextField
                  label="E-mail"
                  type="email"
                  fullWidth
                  variant="outlined"
                  value={cliente?.email || ""}
                  placeholder="E-mail do cliente"
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  onKeyDown={handleEmailKeyDown}
                  disabled={behavior === "update"}
                  InputProps={{
                    style: {
                      fontSize: "0.8rem", // Altere esse valor conforme quiser
                    },
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailOutlineIcon />
                      </InputAdornment>
                    )
                  }}
                  error={!!errors.email}
                  helperText={errors.email}
                />
              </div>
              <div className="form-group col-6 mb-3">
                <TextField
                  label="Nome"
                  type="text"
                  fullWidth
                  variant="outlined"
                  placeholder="Nome do cliente"
                  value={cliente?.nome || ""}
                  onBlur={() => setErrors((p) => ({ ...p, nome: isValidName(cliente?.nome) ? "" : "Nome inválido" }))}
                  error={!!errors.nome}
                  helperText={errors.nome}
                  onChange={(e) => setCliente("nome", e.target.value)}
                  disabled={form.disabled}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    style: {
                      fontSize: "0.8rem", // Altere esse valor conforme quiser
                    },
                  }}
                />
              </div>
              <div className="form-group col-6 mb-3">
                <TextField
                  label="Sobrenome"
                  type="text"
                  fullWidth
                  variant="outlined"
                  placeholder="Sobrenome do cliente"
                  value={cliente?.sobrenome || ""}
                  onBlur={() => setErrors((p) => ({ ...p, sobrenome: isValidSobreName(cliente?.sobrenome) ? "" : "Sobrenome inválido" }))}
                  error={!!errors.sobrenome}
                  helperText={errors.sobrenome}
                  onChange={(e) => setCliente("sobrenome", e.target.value)}
                  disabled={form.disabled}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    style: {
                      fontSize: "0.8rem", // Altere esse valor conforme quiser
                    },
                  }}
                />
              </div>
              <div className="form-group col-6 mb-3">
                <TextField
                  label="Área"
                  type="text"
                  fullWidth
                  variant="outlined"
                  placeholder="(19)"
                  value={maskArea(cliente?.telefone?.area || "")}
                  onChange={(e) => {
                    setTelefoneField("area", e.target.value);
                    setErrors((p) => ({ ...p, area: "" }));
                  }}
                  error={!!errors.area}
                  helperText={errors.area}
                  disabled={form.disabled}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocalPhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    style: {
                      fontSize: "0.8rem", // Altere esse valor conforme quiser
                    },
                  }}
                />
              </div>
              <div className="form-group col-6 mb-3">
                <TextField
                  label="Telefone"
                  type="text"
                  fullWidth
                  variant="outlined"
                  placeholder="Telefone / Whatsapp"
                  value={maskPhone9(cliente?.telefone?.numero || "")}
                  onChange={(e) => setTelefoneField("numero", e.target.value)}
                  onBlur={() =>
                    setErrors((p) => ({
                      ...p,
                      telefone: isValidPhone9(cliente?.telefone?.numero) ? "" : "Telefone deve ter 9 dígitos",
                    }))
                  }
                  error={!!errors.telefone}
                  helperText={errors.telefone}
                  disabled={form.disabled}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneAndroidIcon />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    style: {
                      fontSize: "0.8rem", // Altere esse valor conforme quiser
                    },
                  }}
                />
              </div>
              <div className="form-group col-6 mb-3">
                <TextField
                  label="CEP"
                  type="text"
                  fullWidth
                  variant="outlined"
                  placeholder="Código postal"
                  value={maskCep(cliente?.endereco?.cep || "")}
                  onChange={handleCepChange}
                  onBlur={handleCepBlur}
                  error={!!errors.cep}
                  helperText={errors.cep || (cepLoading ? "Consultando CEP..." : "")}
                  disabled={form.disabled}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SignpostIcon />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    style: {
                      fontSize: "0.8rem", // Altere esse valor conforme quiser
                    },
                    maxLength: 9, // Adicionando o maxLength para limitar a entrada
                  }}
                />
              </div>
              <div className="form-group col-6 mb-3">
                <TextField
                  label="Bairro"
                  type="text"
                  fullWidth
                  variant="outlined"
                  placeholder="Bairro"
                  value={cliente?.endereco.bairro || ""}
                  onChange={(e) =>
                    setCliente("endereco", {
                      ...cliente.endereco,
                      bairro: e.target.value,
                    })
                  }
                  disabled={form.disabled}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SignpostIcon />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    style: {
                      fontSize: "0.8rem", // Altere esse valor conforme quiser
                    },
                  }}
                />
              </div>
              <div className="form-group col-12 mb-3">
                <TextField
                  label="Rua"
                  type="text"
                  fullWidth
                  variant="outlined"
                  placeholder="Nome da rua"
                  value={cliente?.endereco.logradouro || ""}
                  onChange={(e) =>
                    setCliente("endereco", {
                      ...cliente.endereco,
                      logradouro: e.target.value,
                    })
                  }
                  disabled={form.disabled}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SignpostIcon />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    style: {
                      fontSize: "0.8rem", // Altere esse valor conforme quiser
                    },
                  }}
                />
              </div>
              <div className="form-group col-4 mb-3">
                <TextField
                  label="Número"
                  type="number"
                  fullWidth
                  variant="outlined"
                  placeholder="Número"
                  value={cliente?.endereco.numero || ""}
                  onChange={(e) =>
                    setCliente("endereco", {
                      ...cliente.endereco,
                      numero: e.target.value,
                    })
                  }
                  disabled={form.disabled}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SignpostIcon />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    style: {
                      fontSize: "0.8rem", // Altere esse valor conforme quiser
                    },
                  }}
                />
              </div>
              <div className="form-group col-8 mb-3">
                <TextField
                  label="Cidade"
                  type="text"
                  fullWidth
                  variant="outlined"
                  placeholder="Cidade"
                  value={cliente?.endereco.cidade.nome || ""}
                  onChange={(e) =>
                    setCliente("endereco", {
                      ...cliente.endereco,
                      cidade: {
                        ...cliente.endereco.cidade,
                        nome: e.target.value,
                      },
                    })
                  }
                  disabled={form.disabled}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SignpostIcon />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    style: {
                      fontSize: "0.8rem", // Altere esse valor conforme quiser
                    },
                  }}
                />
              </div>
              <div className="form-group col-4 mb-3">
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Tipo do documento</InputLabel>
                  <Select
                    value={cliente?.identificacao.tipoD || ""}
                    onChange={(e) =>
                      setCliente("identificacao", {
                        ...cliente.identificacao,
                        tipoD: e.target.value,
                      })
                    }
                    label="Tipo do documento"
                    disabled={form.disabled}
                    startAdornment={
                      <InputAdornment position="start">
                        <RecentActorsIcon />
                      </InputAdornment>
                    }
                    sx={{ fontSize: "0.8rem" }} // Aplica no valor selecionado
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          fontSize: "0.8rem", // Aplica no dropdown
                        },
                      },
                    }}
                  >
                    <MenuItem value="CPF">CPF</MenuItem>
                    <MenuItem value="CNPJ">CNPJ</MenuItem>
                  </Select>
                </FormControl>
              </div>
              <div className="form-group col-8 mb-3">
                <TextField
                  label="Numero do documento"
                  type="text"
                  fullWidth
                  variant="outlined"
                  placeholder="Digite o número"
                  value={
                    cliente?.identificacao?.tipoD === "CNPJ"
                      ? maskCnpj(cliente?.identificacao?.numero || "")
                      : maskCpf(cliente?.identificacao?.numero || "")
                  }
                  onChange={(e) => setIdentificacaoField("numero", e.target.value)}
                  onBlur={() => {
                    const tipo = cliente?.identificacao?.tipoD;
                    const numero = cliente?.identificacao?.numero || "";
                    const ok = tipo === "CNPJ" ? isValidCnpj(numero) : isValidCpf(numero);
                    setErrors((p) => ({ ...p, documento: ok ? "" : `${tipo || "Documento"} inválido` }));
                  }}
                  error={!!errors.documento}
                  helperText={errors.documento}
                  disabled={form.disabled}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <RecentActorsIcon />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    style: {
                      fontSize: "0.8rem", // Altere esse valor conforme quiser
                    },
                  }}
                />
              </div>
            </div>
          </div>
          <Button
            fullWidth
            variant="contained"
            onClick={handleClickSave}
            loading={loading}
            loadingPosition="start"
            startIcon={<SaveIcon />}
            disabled={isReativar ? false : isSaveDisabled}
            size="large"
            sx={{
              mt: 3,
              backgroundColor: isReativar
                ? "#d32f2f" // vermelho
                : behavior === "create"
                  ? "#2e7d32" // verde
                  : "#1565c0", // azul
              "&:hover": {
                mt: 3,
                backgroundColor: isReativar
                  ? "#b71c1c" // vermelho hover
                  : behavior === "create"
                    ? "#1b5e20"
                    : "#0d47a1",
              },
            }}
          >
            {behavior === "create"
              ? "Salvar"
              : cliente?.vinculo === "E"
                ? "Reativar cadastro"
                : "Salvar alterações"}
          </Button>
        </CustomDrawer>
      </div>
      <Snackbar
        open={alerta.open}
        autoHideDuration={5000}
        onClose={handleClose}
        TransitionComponent={SlideTransition}
        anchorOrigin={{
          vertical: "top",
          horizontal: isMobile ? "center" : "right",
        }}
      >
        <Alert onClose={handleClose} severity={alerta.severity}>
          <strong>{alerta.title}</strong>
          <br />
          {alerta.message}
        </Alert>
      </Snackbar>
      <CustomDialog
        open={components.confirmDelete}
        title="Confirmar exclusão"
        content="Tem certeza que deseja excluir os clientes selecionados? Essa ação não poderá ser desfeita."
        onClose={handleCloseDialog}
        onConfirm={() => {
          if (selectedId) {
            const vinculoId = clientesProcessados[selectedId - 1]?.selectedIx;
            //console.log("Excluir:", clientesProcessados[selectedId - 1]?.selectedIx);
            removeCli(vinculoId); // use o ID diretamente
          }
        }}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
      />
    </div>
  );
};

export default Clientes;
