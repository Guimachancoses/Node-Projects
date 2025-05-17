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
import SearchIcon from "@mui/icons-material/Search";

import { buscarEndereco } from "../../services/apiCep";

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

  const handleClose = () => {
    dispatch(setAlerta({ ...alerta, open: false }));
  };

  useEffect(() => {
    dispatch(allClientes());
  }, []);

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

  const handleEmailChange = (e) => {
    setCliente("email", e.target.value);
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
          onClose={() => setComponent("drawer", false)}
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
                                filterClientes({
                                  filters: {
                                    email: cliente.email,
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
                  placeholder="Nome do cliente"
                  value={cliente?.nome || ""}
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
                  placeholder="+ 55"
                  value={cliente?.telefone.area || ""}
                  onChange={(e) =>
                    setCliente("telefone", {
                      ...cliente.telefone,
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
                  value={cliente?.telefone.numero || ""}
                  onChange={(e) =>
                    setCliente("telefone", {
                      ...cliente.telefone,
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
                  value={cliente?.endereco.cep || ""}
                  onChange={async (e) => {
                    const novoCep = e.target.value;
                    setCliente("endereco", {
                      ...cliente.endereco,
                      cep: novoCep,
                    });

                    // Verifique se o comportamento é 'create' antes de buscar o endereço
                    if (novoCep.length === 8) {
                      const endereco = await buscarEndereco(novoCep);
                      if (endereco) {
                        setCliente("endereco", {
                          ...cliente.endereco,
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
                  value={cliente?.identificacao.numero || ""}
                  onChange={(e) =>
                    setCliente("identificacao", {
                      ...cliente.identificacao,
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
        content="Tem certeza que deseja excluir os clientes selecionados? Essa ação não poderá ser desfeita."
        onClose={handleCloseDialog}
        onConfirm={() => {
          if (selectedId) {
            const vinculoId = clientesProcessados[selectedId -1]?.selectedIx;
            console.log("Excluir:", clientesProcessados[selectedId -1]?.selectedIx);
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
