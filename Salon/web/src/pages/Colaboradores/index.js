import React, { useEffect, useState } from "react";

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
import OutlinedInput from "@mui/material/OutlinedInput";

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
import SearchIcon from "@mui/icons-material/Search";
import AutorenewIcon from "@mui/icons-material/Autorenew";

import { buscarEndereco } from "../../services/apiCep";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

const Colaboradores = () => {
  const dispatch = useDispatch();
  const { colaborador, colaboradores, behavior, form, components, servicos } =
    useSelector((state) => state.colaborador);

  const alerta = useSelector((state) => state.colaborador.alerta);

  const handleClose = () => {
    dispatch(setAlerta({ ...alerta, open: false }));
  };

  useEffect(() => {
    dispatch(allColaboradores());
    dispatch(allServicos());
  }, []);

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
    setComponent("drawer", true);
    //console.log("Criar novo cliente");
  };

  const handleEmailChange = (e) => {
    setColaborador("email", e.target.value);
  };

  const colaboradoresProcessados = colaboradores.map(
    (colaborador, index, selectedIds) => {
      const telefone = colaborador.telefone;
      const vinculoIx = colaborador.vinculoId
      let telefoneFormatado = "Telefone inválido";
      if (telefone && telefone.area && telefone.numero) {
        const numero = telefone.numero ? String(telefone.numero) : "";
        telefoneFormatado = `(${numero.substring(0, 2)}) ${numero.substring(
          2,
          7
        )}-${numero.substring(7)}`;
      }
      selectedIds.includes(colaborador.vinculoId);
      return { ...colaborador, telefoneFormatado, id: index + 1, selectedIds, vinculoIx };
    }
  );

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
  const [selectedToDelete, setSelectedToDelete] = useState([]);

  const handleOpenDialog = (selectedIds) => {
    setSelectedId(selectedIds[0]);
    setComponent("confirmDelete", true);
  };

  const handleCloseDialog = () => {
    setComponent("confirmDelete", false);
    setSelectedToDelete([]);
  };

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
                  disabled={behavior === "update"}
                  InputProps={{
                    style: {
                      fontSize: "0.8rem", // Altere esse valor conforme quiser
                    },
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailOutlineIcon />
                      </InputAdornment>
                    ),
                    endAdornment:
                      behavior === "create" ? (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              dispatch(
                                filterColaboradores({
                                  filters: {
                                    email: colaborador.email,
                                    status: "A",
                                  },
                                })
                              )
                            }
                            disabled={form.filtering}
                          >
                            {form.filtering ? (
                              <div style={{ width: 24, height: 24 }}>
                                <span className="loader" />
                              </div>
                            ) : (
                              <SearchIcon />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ) : null,
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
                    multiple
                    value={colaborador?.especialidades || []}
                    onChange={(e) =>
                      setColaborador("especialidades", e.target.value)
                    }
                    label="Especialidades"
                    disabled={form.disabled && behavior === "create"}
                    input={<OutlinedInput label="Especialidades" />}
                    renderValue={(selected) =>
                      servicos
                        .filter((s) => selected.includes(s.value))
                        .map((s) => s.label)
                        .join(", ")
                    }
                    startAdornment={
                      <InputAdornment position="start">
                        <AutorenewIcon />
                      </InputAdornment>
                    }
                    sx={{ fontSize: "0.8rem" }}
                    MenuProps={{
                      PaperProps: {
                        sx: { fontSize: "0.8rem" },
                      },
                    }}
                  >
                    {servicos.map((esp) => (
                      <MenuItem key={esp.value} value={esp.value}>
                        <Checkbox
                          checked={colaborador?.especialidades?.includes(
                            esp.value
                          )}
                        />
                        <ListItemText primary={esp.label} />
                      </MenuItem>
                    ))}
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
            const vinculoId = colaboradoresProcessados[selectedId -1]?.vinculoIx;
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
