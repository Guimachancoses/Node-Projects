import React, { useEffect, useState, useMemo, useRef } from "react";

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

import { buscarEndereco } from "../../services/apiCep";

import { useUser } from "@clerk/clerk-react";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

const Colaboradores = () => {
  const dispatch = useDispatch();
  const { user: userStore, colaborador, colaboradores, behavior, form, components, servicos } =
    useSelector((state) => state.colaborador);

  const { user } = useUser();

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
    dispatch(
      updateColaborador({
        behavior: "create",
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
          // Adicione outros campos que você usa no formulário aqui, se houver
        },
      })
    );
    ultimoEmailVerificadoRef.current = "";
    if (debounceEmailRef.current) clearTimeout(debounceEmailRef.current);
    setComponent("drawer", true);
    //console.log("Criar novo cliente");
  };

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
          status: "A",
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
    const vinculoIx = colaborador.vinculoId;

    let telefoneFormatado = "Telefone inválido";
    if (telefone && telefone.area && telefone.numero) {
      const numero = String(telefone.numero || "");
      telefoneFormatado = `(${numero.substring(0, 2)}) ${numero.substring(2, 7)}-${numero.substring(7)}`;
    }

    return {
      ...colaborador,
      telefoneFormatado,
      id: index + 1,
      vinculoIx,
    };
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
                console.log(selectedIds);
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
          anchor="right"
          isOpen={components.drawer}
          onClose={() => setComponent("drawer", false)}
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
                  placeholder="+ 55"
                  value={colaborador?.telefone.area || ""}
                  onChange={(e) =>
                    setColaborador("telefone", {
                      ...colaborador.telefone,
                      area: e.target.value,
                    })
                  }
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
                  value={colaborador?.telefone.numero || ""}
                  onChange={(e) =>
                    setColaborador("telefone", {
                      ...colaborador.telefone,
                      numero: e.target.value,
                    })
                  }
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
                  value={colaborador?.endereco.cep || ""}
                  onChange={async (e) => {
                    const novoCep = e.target.value;
                    setColaborador("endereco", {
                      ...colaborador.endereco,
                      cep: novoCep,
                    });

                    // Verifique se o comportamento é 'create' antes de buscar o endereço
                    if (novoCep.length === 8) {
                      const endereco = await buscarEndereco(novoCep);
                      if (endereco) {
                        setColaborador("endereco", {
                          ...colaborador.endereco,
                          cep: novoCep,
                          logradouro: endereco.logradouro || "",
                          bairro: endereco.bairro || "",
                          cidade: {
                            nome: endereco.localidade || "",
                          },
                        });
                      }
                      console.log(endereco);
                    }
                  }}
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
                    maxLength: 8, // Adicionando o maxLength para limitar a entrada
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
                  value={colaborador?.identificacao.numero || ""}
                  onChange={(e) =>
                    setColaborador("identificacao", {
                      ...colaborador.identificacao,
                      numero: e.target.value,
                    })
                  }
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
                  </Select>
                </FormControl>
              </div>
              <div className="form-group col-8 mb-3">
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Especialidades</InputLabel>
                  <Select
                    label="Especialidades"
                    multiple
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
            loading={loading}
            loadingPosition="start"
            startIcon={<SaveIcon />}
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
