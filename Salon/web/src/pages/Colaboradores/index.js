import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";

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
  Checkbox,
  ListItemText,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Slide from "@mui/material/Slide";

import { useDispatch, useSelector } from "react-redux";

import {
  allColaboradores,
  updateColaborador,
  filterColaboradores,
  addColaborador,
  setAlerta,
  unlinkColaborador,
  allServicos,
} from "../../store/modules/colaborador/actions";

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
import AutorenewIcon from "@mui/icons-material/Autorenew";
import ContentCutIcon from '@mui/icons-material/ContentCut';

import { buscarEndereco } from "../../services/apiCep";

import { useUser } from "@clerk/clerk-react";

import {
  isValidEmail,
  isValidName,
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
  isValidSobreName
} from "../../utils/formValidators";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

const Colaboradores = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const { user: userStore, colaborador, colaboradores, behavior, form, components, servicos } =
    useSelector((state) => state.colaborador);

  const { user } = useUser();

  const [errors, setErrors] = useState({});
  const [cepLoading, setCepLoading] = useState(false);
  const ultimoCepBuscadoRef = useRef("");
  const cepRequestIdRef = useRef(0);

  const setTelefoneField = (key, value) => {
    setColaborador("telefone", {
      ...colaborador.telefone,
      [key]: onlyDigits(value),
    });
  };

  const setEndereco = (patch) => {
    setColaborador("endereco", {
      ...colaborador.endereco,
      ...patch,
      cidade: {
        ...colaborador.endereco?.cidade,
        ...(patch.cidade || {}),
      },
    });
  };

  const handleCepChange = (e) => {
    const cep = onlyDigits(e.target.value).slice(0, 8);

    setEndereco({ cep });
    setErrors((prev) => ({ ...prev, cep: "" }));

    // permite nova busca quando CEP muda
    if (cep.length < 8) {
      ultimoCepBuscadoRef.current = "";
    }
  };

  const handleCepBlur = async () => {
    const cep = onlyDigits(colaborador?.endereco?.cep || "");

    if (!cep) return; // se não for obrigatório, apenas sai

    if (!isValidCep(cep)) {
      setErrors((prev) => ({ ...prev, cep: "CEP deve conter 8 dígitos" }));
      return;
    }

    // evita bater na API repetidamente para o mesmo CEP
    if (ultimoCepBuscadoRef.current === cep) return;
    ultimoCepBuscadoRef.current = cep;

    const requestId = ++cepRequestIdRef.current;
    setCepLoading(true);

    const endereco = await buscarEndereco(cep);

    // evita race condition
    if (requestId !== cepRequestIdRef.current) return;

    setCepLoading(false);

    if (!endereco) {
      setErrors((prev) => ({ ...prev, cep: "CEP não encontrado" }));
      return;
    }

    setErrors((prev) => ({ ...prev, cep: "" }));

    // preenche somente campos vindos do CEP e preserva número/complementos
    setEndereco({
      cep,
      logradouro: endereco.logradouro || "",
      bairro: endereco.bairro || "",
      cidade: { nome: endereco.localidade || "" },
    });
  };

  const setIdentificacaoField = (key, value) => {
    setColaborador("identificacao", {
      ...colaborador.identificacao,
      [key]:
        key === "numero"
          ? onlyDigits(value)
          : value,
    });
  };

  const handleAreaChange = (e) => {
    const typed = e.target.value;
    const prevDigits = onlyDigits(colaborador?.telefone?.area || "");
    const nextDigitsRaw = onlyDigits(typed).slice(0, 2);

    const prevMasked = maskArea(prevDigits);

    // usuário apagou só máscara (ex: de "(11)" para "(11")
    const deletingMaskChar =
      typed.length < prevMasked.length && nextDigitsRaw === prevDigits;

    const nextDigits = deletingMaskChar
      ? prevDigits.slice(0, -1)
      : nextDigitsRaw;

    setColaborador("telefone", {
      ...colaborador.telefone,
      area: nextDigits,
    });

    setErrors((p) => ({ ...p, area: "" }));
  };

  const loggedEmail =
    (userStore?.email || user?.emailAddresses?.[0]?.emailAddress || "")
      .trim()
      .toLowerCase();

  const loggedVinculoId = String(userStore?.vinculoId || "");
  const loggedColaboradorId = String(userStore?._id || "");

  const alerta = useSelector((state) => state.colaborador.alerta);

  const handleClose = () => {
    dispatch(setAlerta({ ...alerta, open: false }));
  };

  useEffect(() => {
    dispatch(allColaboradores());
    dispatch(allServicos());
  }, [dispatch]);

  const setComponent = (component, state) => {
    dispatch(
      updateColaborador({
        components: { ...components, [component]: state },
      })
    );
  };

  const setColaborador = (key, value) => {
    dispatch(
      updateColaborador({
        colaborador: { ...colaborador, [key]: value },
      })
    );
  };

  const handleNovoColaborador = () => {
    originalRef.current = null;
    loadedIdentityRef.current = "";
    dispatch(
      updateColaborador({
        behavior: "create",
        form: { disabled: true },
        colaborador: {
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
        },
      })
    );
    ultimoEmailVerificadoRef.current = "";
    if (debounceEmailRef.current) clearTimeout(debounceEmailRef.current);
    setComponent("drawer", true);
    //console.log("Criar novo cliente");
  };

  const handleCloseDrawer = () => {
    setErrors({});
    originalRef.current = null;
    loadedIdentityRef.current = "";
    setComponent("drawer", false);
  };

  useEffect(() => {
    if (components.drawer && behavior === "update") {
      setErrors({});
    }
  }, [components.drawer, behavior]);

  const debounceEmailRef = useRef(null);
  const ultimoEmailVerificadoRef = useRef("");

  const validarFormatoEmail = (value = "") => /\S+@\S+\.\S+/.test(value);

  const verificarEmail = (rawEmail, { force = false } = {}) => {
    const emailNormalizado = (rawEmail || "").trim().toLowerCase();

    if (!emailNormalizado) return;
    if (!validarFormatoEmail(emailNormalizado)) return;

    // só bloqueia repetição se NÃO for forçado
    if (!force && ultimoEmailVerificadoRef.current === emailNormalizado) return;

    ultimoEmailVerificadoRef.current = emailNormalizado;

    dispatch(
      filterColaboradores({
        filters: {
          email: emailNormalizado,
          salaoId: process.env.REACT_APP_SALAO_ID,
        },
      })
    );
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setColaborador("email", value);

    if (!value?.trim()) {
      ultimoEmailVerificadoRef.current = "";
      return;
    }

    if (debounceEmailRef.current) clearTimeout(debounceEmailRef.current);
    debounceEmailRef.current = setTimeout(() => {
      verificarEmail(value);
    }, 500);
  };

  const handleEmailBlur = () => {
    if (debounceEmailRef.current) clearTimeout(debounceEmailRef.current);
    verificarEmail(colaborador?.email || "", { force: true });
    setErrors((prev) => ({
      ...prev,
      email: isValidEmail(colaborador?.email) ? "" : "E-mail inválido. Ex: nome@dominio.com.br",
    }))
  };

  const handleEmailKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (debounceEmailRef.current) clearTimeout(debounceEmailRef.current);
      verificarEmail(colaborador?.email || "", { force: true });
    }
  };

  useEffect(() => {
    return () => {
      if (debounceEmailRef.current) clearTimeout(debounceEmailRef.current);
    };
  }, []);

  const colaboradoresFiltrados = useMemo(() => {
    return (colaboradores || []).filter((c) => {
      const email = (c?.email || "").trim().toLowerCase();
      const vinculoId = String(c?.vinculoId || "");
      const colaboradorId = String(c?._id || "");

      const sameByEmail = loggedEmail && email === loggedEmail;
      const sameByVinculo = loggedVinculoId && vinculoId === loggedVinculoId;
      const sameById = loggedColaboradorId && colaboradorId === loggedColaboradorId;

      return !(sameByEmail || sameByVinculo || sameById);
    });
  }, [colaboradores, loggedEmail, loggedVinculoId, loggedColaboradorId]);

  const colaboradoresProcessados = colaboradoresFiltrados.map((colaborador, index) => {
    const telefone = colaborador.telefone;
    let telefoneFormatado = "Telefone inválido";

    if (telefone && telefone.area && telefone.numero) {
      const numero = telefone.numero ? String(telefone.numero) : "";
      telefoneFormatado = `(${numero.substring(0, 2)}) ${numero.substring(2, 7)}-${numero.substring(7)}`;
    }

    // vinculo pode vir string ("A"/"I") ou objeto
    const statusRaw =
      typeof colaborador?.vinculo === "string"
        ? colaborador.vinculo
        : colaborador?.vinculo?.status || colaborador?.status || "A";

    const statusFormat = String(statusRaw).toUpperCase() === "A" ? "Ativo" : "Inativo";

    return {
      ...colaborador,
      telefoneFormatado,
      statusFormat,
      id: index + 1,
      selectedIx: colaborador._id,
    };
  });

  const columns = [
    { field: "id", headerName: "ID", width: 10, fixed: true },
    { field: "nome", headerName: "Nome", width: 100 },
    { field: "sobrenome", headerName: "Sobrenome", width: 100 },
    { field: "email", headerName: "E-mail", width: 150 },
    { field: "telefoneFormatado", headerName: "Telefone", width: 150 },
    { field: "statusFormat", headerName: "Status", width: 120 },
  ];

  const filtro = (
    <Tooltip title="Filtrar" sx={{ color: "white" }}>
      <IconButton onClick={() => console.log("Abrir filtros")}>
        <FilterListIcon />
      </IconButton>
    </Tooltip>
  );

  const renderDetalhesColaborador = (row) => (
    <>
      <Typography variant="h6" gutterBottom>
        🧾 Ficha do Colaborador
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

  const saveColab = () => {
    dispatch(addColaborador());
    //console.log("Clicou em salvar");
  };

  const removeColab = (vinculoId) => {
    dispatch(unlinkColaborador(vinculoId));
  };

  const [loading, setLoading] = React.useState(false);

  const handleClickSave = () => {
    setLoading(true);
    saveColab();
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

  const especialidadesValue = (colaborador?.especialidades || [])
    .map((e) => {
      if (typeof e === "string") return String(e);
      return String(e?.value || e?._id || e?.id || e?.servicoId || e?.servicoId?._id || "");
    })
    .filter(Boolean);

  const normalizeForCompare = useCallback((c = {}) => ({
    nome: (c.nome || "").trim(),
    sobrenome: (c.sobrenome || "").trim(),
    email: (c.email || "").trim().toLowerCase(),
    vinculo: c.vinculo || "A",
    especialidades: (c.especialidades || []).map(String).sort(),
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

  const originalRef = useRef(null);
  const loadedIdentityRef = useRef("");
  const colaboradorId = colaborador?._id || "";
  const vinculoId = colaborador?.vinculoId || "";

  useEffect(() => {
    if (!components.drawer || behavior !== "update") return;

    const identity = `${colaboradorId}-${vinculoId}`;
    if (!identity) return;

    if (loadedIdentityRef.current !== identity) {
      originalRef.current = normalizeForCompare(colaborador);
      loadedIdentityRef.current = identity;
    }
  }, [components.drawer, behavior, colaboradorId, vinculoId, colaborador, normalizeForCompare]);

  const hasErrors = useMemo(
    () => Object.values(errors || {}).some((v) => Boolean(v)),
    [errors]
  );

  const requiredFilled = useMemo(() => {
    const c = colaborador || {};
    return Boolean(
      (c.email || "").trim() &&
      (c.nome || "").trim() &&
      (c.sobrenome || "").trim() &&
      onlyDigits(c?.telefone?.area || "").length === 2 &&
      onlyDigits(c?.telefone?.numero || "").length === 9 &&
      onlyDigits(c?.endereco?.cep || "").length === 8 &&
      (c?.endereco?.logradouro || "").trim() &&
      String(c?.endereco?.numero ?? "").trim() &&
      (c?.endereco?.bairro || "").trim() &&
      (c?.endereco?.cidade?.nome || "").trim() &&
      (c?.identificacao?.tipoD || "").trim() &&
      (c?.identificacao?.numero || "").trim()
    );
  }, [colaborador]);

  const hasChanges = useMemo(() => {
    if (behavior === "create") return true;
    if (!originalRef.current) return false;

    const now = normalizeForCompare(colaborador);
    return JSON.stringify(now) !== JSON.stringify(originalRef.current);
  }, [behavior, colaborador, normalizeForCompare]);

  const isSaveDisabled = useMemo(() => {
    if (loading || form?.saving || form?.filtering) return true;
    if (hasErrors) return true;

    if (behavior === "create") {
      if (!requiredFilled) return true;
      return false;
    }

    // update
    if (!hasChanges) return true;
    return false;
  }, [loading, form?.saving, form?.filtering, hasErrors, behavior, requiredFilled, hasChanges]);

  const isReativar = behavior !== "create" && colaborador?.vinculo === "E";

  return (
    <div className="col">
      <TableComponent
        loading={form.filtering}
        title="Colaboradores"
        rows={colaboradoresProcessados}
        columns={columns}
        buttonLabel="Novo Colaborador"
        iconClass="mdi mdi-plus"
        onButtonClick={handleNovoColaborador}
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
        onRowClick={(colaborador) => {
          dispatch(
            updateColaborador({
              behavior: "update",
              colaborador,
              form: {
                ...colaborador.form,
                disabled: false, // <- ativa edição manualmente aqui
              },
            })
          );
          setComponent("drawer", true);
        }}
        checkboxSelection={true}
        renderExpandedRow={renderDetalhesColaborador}
      />
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
              {behavior === "create" ? "Criar Novo" : "Atualizar"} Colaborador
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
                  value={colaborador?.email || ""}
                  placeholder="E-mail do colaborador"
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  onKeyDown={handleEmailKeyDown}
                  disabled={behavior === "update"}
                  InputProps={{
                    style: { fontSize: "0.8rem" },
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailOutlineIcon />
                      </InputAdornment>
                    ),
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
                  placeholder="Nome do colaborador"
                  value={colaborador?.nome || ""}
                  onBlur={() =>
                    setErrors((p) => ({
                      ...p,
                      nome: isValidName(colaborador?.nome) ? "" : "Nome inválido",
                    }))
                  }
                  error={!!errors.nome}
                  helperText={errors.nome}
                  onChange={(e) => setColaborador("nome", e.target.value)}
                  disabled={form.disabled && behavior === "create"}
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
                  placeholder="Sobrenome do colaborador"
                  value={colaborador?.sobrenome || ""}
                  onBlur={() =>
                    setErrors((p) => ({
                      ...p,
                      sobrenome: isValidSobreName(colaborador?.sobrenome) ? "" : "Sobrenome inválido",
                    }))
                  }
                  error={!!errors.sobrenome}
                  helperText={errors.sobrenome}
                  onChange={(e) => setColaborador("sobrenome", e.target.value)}
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
                  onChange={handleAreaChange}
                  value={maskArea(colaborador?.telefone?.area || "")}
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
                  value={maskPhone9(colaborador?.telefone?.numero || "")}
                  onChange={(e) => setTelefoneField("numero", e.target.value)}
                  onBlur={() =>
                    setErrors((p) => ({
                      ...p,
                      telefone: isValidPhone9(colaborador?.telefone?.numero) ? "" : "Telefone deve ter 9 dígitos",
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
                  value={maskCep(colaborador?.endereco?.cep || "")}
                  onChange={handleCepChange}
                  onBlur={handleCepBlur}
                  disabled={form.disabled}
                  error={!!errors.cep}
                  helperText={errors.cep || (cepLoading ? "Consultando CEP..." : "")}
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
                  value={colaborador?.endereco.bairro || ""}
                  onChange={(e) =>
                    setColaborador("endereco", {
                      ...colaborador.endereco,
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
                  value={colaborador?.endereco.logradouro || ""}
                  onChange={(e) =>
                    setColaborador("endereco", {
                      ...colaborador.endereco,
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
                  value={colaborador?.endereco.numero || ""}
                  onChange={(e) =>
                    setColaborador("endereco", {
                      ...colaborador.endereco,
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
                  value={colaborador?.endereco.cidade.nome || ""}
                  onChange={(e) =>
                    setColaborador("endereco", {
                      ...colaborador.endereco,
                      cidade: {
                        ...colaborador.endereco.cidade,
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
                    value={colaborador?.identificacao.tipoD || ""}
                    onChange={(e) =>
                      setColaborador("identificacao", {
                        ...colaborador.identificacao,
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
                    colaborador?.identificacao?.tipoD === "CNPJ"
                      ? maskCnpj(colaborador?.identificacao?.numero || "")
                      : maskCpf(colaborador?.identificacao?.numero || "")
                  }
                  onChange={(e) => setIdentificacaoField("numero", e.target.value)}
                  onBlur={() => {
                    const tipo = colaborador?.identificacao?.tipoD;
                    const numero = colaborador?.identificacao?.numero || "";
                    const ok = tipo === "CNPJ" ? isValidCnpj(numero) : isValidCpf(numero);

                    setErrors((p) => ({
                      ...p,
                      documento: ok ? "" : `${tipo || "Documento"} inválido`,
                    }));
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
              <div className="form-group col-4 mb-3">
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={colaborador?.vinculo || ""}
                    onChange={(e) => setColaborador("vinculo", e.target.value)}
                    label="Status"
                    disabled={form.disabled && behavior === "create"}
                    startAdornment={
                      <InputAdornment position="start">
                        <AutorenewIcon />
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
                    <MenuItem value="A">Ativo</MenuItem>
                    <MenuItem value="I">Inativo</MenuItem>
                    {colaborador?.vinculo === "E" &&
                      <MenuItem value="E">Desativado</MenuItem>
                    }
                  </Select>
                </FormControl>
              </div>
              <div className="form-group col-8 mb-3">
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Especialidades</InputLabel>
                  <Select
                    label="Especialidades"
                    multiple
                    disabled={form.disabled}
                    startAdornment={
                      <InputAdornment position="start">
                        <ContentCutIcon />
                      </InputAdornment>
                    }
                    value={especialidadesValue}
                    onChange={(e) =>
                      setColaborador("especialidades", (e.target.value || []).map((v) => String(v)))
                    }
                    renderValue={(selected) =>
                      (servicos || [])
                        .filter((s) => selected.includes(String(s.value || s._id || s.id)))
                        .map((s) => s.label || s.nome)
                        .join(", ")
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
                    {(servicos || []).map((esp) => {
                      const optionValue = String(esp.value || esp._id || esp.id);
                      return (
                        <MenuItem key={optionValue} value={optionValue}>
                          <Checkbox checked={especialidadesValue.includes(optionValue)} />
                          <ListItemText primary={esp.label || esp.nome} />
                        </MenuItem>
                      );
                    })}

                  </Select>
                </FormControl>
              </div>
            </div>
          </div>
          <Button
            fullWidth
            variant="contained"
            onClick={handleClickSave}
            disabled={isReativar ? false : isSaveDisabled}
            loading={loading}
            loadingPosition="start"
            startIcon={<SaveIcon />}
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
              : colaborador?.vinculo === "E"
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
        content="Tem certeza que deseja excluir os colaborador selecionado? Essa ação não poderá ser desfeita."
        onClose={handleCloseDialog}
        onConfirm={() => {
          if (selectedId) {
            const vinculoId = colaboradoresProcessados[selectedId - 1]?.vinculoIx;
            //console.log("Excluir:", colaboradoresProcessados[selectedId -1]?.vinculoIx);
            removeColab(vinculoId); // use o ID diretamente
          }
        }}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
      />
    </div>
  );
};

export default Colaboradores;
