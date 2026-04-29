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
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Slide from "@mui/material/Slide";

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

  const clientesProcessados = clientes.map((cliente, index, selectedIds) => {
    const telefone = cliente.telefone;
    const selectedIx = cliente._id;
    let telefoneFormatado = "Telefone inválido";
    if (telefone && telefone.area && telefone.numero) {
      const numero = telefone.numero ? String(telefone.numero) : "";
      telefoneFormatado = `(${numero.substring(0, 2)}) ${numero.substring(
        2,
        7
      )}-${numero.substring(7)}`;
    }
    selectedIds.includes(cliente.vinculoId);
    return { ...cliente, telefoneFormatado, id: index + 1, selectedIds, selectedIx };
  });

  const columns = [
    { field: "id", headerName: "ID", width: 10, fixed: true },
    { field: "nome", headerName: "Nome", width: 100 },
    { field: "sobrenome", headerName: "Sobrenome", width: 100 },
    { field: "email", headerName: "E-mail", width: 150 },
    { field: "telefoneFormatado", headerName: "Telefone", width: 150 },
  ];

  const filtro = (
    <Tooltip title="Filtrar" sx={{ color: "white" }}>
      <IconButton onClick={() => console.log("Abrir filtros")}>
        <FilterListIcon />
      </IconButton>
    </Tooltip>
  );

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
  }, [components.drawer, behavior, cliente?._id, cliente?.vinculoId, normalizeForCompare]); // <- evita depender do objeto inteiro

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

  console.log("cliente", cliente)

  return (
    <div className="col">
      <TableComponent
        loading={form.filtering}
        title="Clientes"
        rows={clientesProcessados}
        columns={columns}
        buttonLabel="Novo Cliente"
        iconClass="mdi mdi-plus"
        onButtonClick={handleNovoCliente}
        toolbarComponent={(selectedIds) => (
          <>
            {filtro}
            <Button
              variant="outlined"
              color="error"
              disabled={selectedIds.length === 0}
              onClick={() => {
                handleOpenDialog(selectedIds);
                //console.log(selectedIds);
              }}
            >
              Excluir
            </Button>
          </>
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
      {/* Drawer Component Controlado diretamente pelo estado do Redux */}
      <div
        style={{ display: "flex", flexDirection: "column", marginLeft: "16px" }}
      >
        <CustomDrawer
          show={components.drawer}
          anchor="right"
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
              backgroundColor: behavior === "create" ? "#2e7d32" : "#1565c0", // verde e azul
              "&:hover": {
                mt: 3,
                backgroundColor: behavior === "create" ? "#1b5e20" : "#0d47a1",
              },
            }}
          >
            {behavior === "create" ? "Salvar" : "Salvar alterações"}
          </Button>
        </CustomDrawer>
      </div>
      <Snackbar
        open={alerta.open}
        autoHideDuration={5000}
        onClose={handleClose}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
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
