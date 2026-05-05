import React, { useEffect, useState, useMemo, useRef } from "react";
import moment from "moment";
import dayjs from "dayjs";
import consts from "../../consts";

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
  Avatar,
  Stack,
  Grid,
  Box,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Slide from "@mui/material/Slide";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { DemoContainer, DemoItem } from "@mui/x-date-pickers/internals/demo";
import ManageSearchIcon from '@mui/icons-material/ManageSearch';

import { useDispatch, useSelector } from "react-redux";

import {
  allServicos,
  updateServico,
  addServico,
  setAlerta,
  removeServico,
  removeArquivo,
} from "../../store/modules/servico/actions";

// components
import TableComponent from "../../components/Table";
import CustomDrawer from "../../components/Drawer";
import CustomDialog from "../../components/DialogAlert";

// icons
import FilterListIcon from "@mui/icons-material/FilterList";
import SaveIcon from "@mui/icons-material/Save";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import SubtitlesIcon from "@mui/icons-material/Subtitles";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import DateRangeIcon from "@mui/icons-material/DateRange";
import PercentIcon from "@mui/icons-material/Percent";
import DescriptionIcon from "@mui/icons-material/Description";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import CloseIcon from "@mui/icons-material/Close";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

const Servicos = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const { servico, servicos, behavior, form, components } = useSelector(
    (state) => state.servico
  );

  useEffect(() => {
    dispatch(allServicos());
  }, [dispatch]);

  const setComponent = (component, state) => {
    dispatch(
      updateServico({
        components: { ...components, [component]: state },
      })
    );
  };

  const setServico = (key, value) => {
    dispatch(
      updateServico({
        servico: { ...servico, [key]: value },
      })
    );
  };

  // Responsável pelo upload e remove das imagens
  const [images, setImages] = useState([]);
  const [removedImagePreviews, setRemovedImagePreviews] = useState([]);

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);

    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    // Atualiza o preview
    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);

    // Atualiza o servico com os arquivos reais
    const arquivosParaEnviar = updatedImages
      .filter((img) => img.file)
      .map((img) => img.file);

    setServico("arquivos", arquivosParaEnviar);

    //console.log("Imagens carregadas:", newImages);
    //console.log("Arquivos para o serviço:", arquivosParaEnviar);
  };

  // Casp clique em remover a imagem
  const handleRemoveImage = (indexToRemove) => {
    const imagemRemovida = images[indexToRemove];
    //console.log("Removendo imagem:", imagemRemovida);

    // Adiciona à lista de removidos, se for imagem do banco (sem `file`)
    if (behavior === "update" && !imagemRemovida.file) {
      setRemovedImagePreviews((prev) => [...prev, imagemRemovida.preview]);
    }

    const updatedImages = images.filter((_, index) => index !== indexToRemove);
    setImages(updatedImages);

    const arquivosParaEnviar = updatedImages
      .filter((img) => img.file)
      .map((img) => img.file);

    setServico("arquivos", arquivosParaEnviar);
  };

  useEffect(() => {
    if (
      behavior === "update" &&
      servico?.arquivos?.length &&
      images.length === 0
    ) {
      const imagensSalvas = servico.arquivos.map((arquivo) => ({
        file: null,
        preview: `${consts.bucketUrl}/${arquivo.caminho}`,
      }));
      setImages(imagensSalvas);
    }
  }, [servico, behavior, images, dispatch]);

  // Responsavel pelo alerta
  const alerta = useSelector((state) => state.servico.alerta);

  const handleClose = () => {
    dispatch(setAlerta({ ...alerta, open: false }));
  };

  // responsavel por limapr os campos
  const handleNovoServico = () => {
    dispatch(
      updateServico({
        behavior: "create",
        servico: {
          titulo: "",
          preco: "",
          comissao: "",
          duracao: "",
          recorrencia: "",
          status: "",
          arquivos: [],
        },
      })
    );
    setImages([]); // ⬅️ limpa os previews locais
    setComponent("drawer", true);
    //console.log("Criar novo cliente");
  };

  // Atribui e formata as variaveis do serviço
  const servicosProcessados = servicos.map((servico, index) => {
    const precoFormat = `R$ ${servico.preco.toFixed(2)}`;
    const comissaoFormat = `${servico.comissao}%`;
    const recorrenciaFormat = `${servico.recorrencia} dias`;
    const duracaoFormat = moment(servico.duracao).format("HH:mm");
    const statusFormat = servico.status === "A" ? "Ativo" : "inativo";
    const selectedIds = servico._id;

    return {
      ...servico,
      precoFormat,
      comissaoFormat,
      recorrenciaFormat,
      duracaoFormat,
      statusFormat,
      id: index + 1,
      selectedIds,
    };
  });

  // Atribui cada coluna e seus valores
  const columns = [
    { field: "id", headerName: "ID", width: 10, fixed: true },
    { field: "titulo", headerName: "Título", width: 100 },
    { field: "precoFormat", headerName: "R$ Preço", width: 100 },
    { field: "comissaoFormat", headerName: "% Comissão", width: 150 },
    {
      field: "recorrenciaFormat",
      headerName: "Recorrência (dias)",
      width: 150,
    },
    { field: "duracaoFormat", headerName: "Duração", width: 150 },
    { field: "tipoServico", headerName: "Tipo de Serviço", width: 150 },
    { field: "statusFormat", headerName: "Status", width: 150 },
  ];

  // Responsavel pelo filtro na tabela
  const filtro = (
    <Tooltip title="Filtrar" sx={{ color: "white" }}>
      <IconButton onClick={() => console.log("Abrir filtros")}>
        <FilterListIcon />
      </IconButton>
    </Tooltip>
  );

  // Responsável pelos detalhes das linhas
  const renderDetalhesServico = (row) => (
    <>
      <Typography variant="h6" gutterBottom>
        🧾 Ficha do Servico
      </Typography>
      <Typography variant="body1">
        Título: <strong>{row.titulo}</strong>
      </Typography>
      <Typography variant="body1">
        Preço: <strong>{row.preco}</strong>
      </Typography>
      <Typography variant="body1">
        Comissão: <strong>{row.comissao}</strong>
      </Typography>
      <Typography variant="body1">
        Data Cadastro:{" "}
        <strong>
          {new Date(row.dataCadastro).toLocaleDateString("pt-BR")}
        </strong>
      </Typography>
    </>
  );

  // Mostrar loading ao salvar ou excluir
  const [loading, setLoading] = React.useState(false);

  // Ao clicar em salvar
  const save = () => {
    dispatch(addServico());
    //console.log("Clicou em salvar");
  };

  // Ao clicar em excluir
  const remove = (vinculoId) => {
    dispatch(removeServico(vinculoId));
  };

  const handleClickSave = () => {
    setLoading(true);

    // Remove arquivos no banco de dados (somente os previews marcados)
    if (behavior === "update" && removedImagePreviews.length > 0) {
      removedImagePreviews.forEach((previewUrl) => {
        const caminhoS3 = previewUrl.replace(`${consts.bucketUrl}/`, "");
        dispatch(removeArquivo(caminhoS3));
      });
    }

    save();

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

  // Função para formatar o valor com 2 casas decimais
  const formatPreco = (value) => {
    if (value != null) {
      const parsedValue = parseFloat(value);
      // Se o valor for um número válido, formata com 2 casas decimais
      if (!isNaN(parsedValue)) {
        return parsedValue.toFixed(2);
      }
    }
    return "";
  };

  const [isFocused, setIsFocused] = useState(false);

  const handlePrecoChange = (e) => {
    const value = e.target.value;

    // Verifica se a entrada é numérica e permite até duas casas decimais
    const regex = /^[0-9]*(\.[0-9]{0,2})?$/;

    if (regex.test(value)) {
      setServico("preco", value);
    }
  };

  const originalServicoRef = useRef(null);
  const [snapshotReady, setSnapshotReady] = useState(false);

  const normalizeServico = (s = {}) => ({
    titulo: (s.titulo || "").trim(),
    preco: String(s.preco ?? "").trim(),
    recorrencia: String(s.recorrencia ?? "").trim(),
    comissao: String(s.comissao ?? "").trim(),
    status: (s.status || "").trim(),
    tipoServico: (s.tipoServico || "").trim(),
    duracao: s.duracao ? new Date(s.duracao).toISOString() : "",
    descricao: (s.descricao || "").trim(),
  });

  // Campos obrigatórios (ajuste se quiser tirar descrição, por exemplo)
  const requiredFilled = useMemo(() => {
    const s = normalizeServico(servico);
    return (
      s.titulo &&
      s.preco &&
      s.recorrencia &&
      s.comissao &&
      s.status &&
      s.tipoServico &&
      s.duracao &&
      s.descricao
    );
  }, [servico]);

  // Snapshot original somente quando abre em update
  useEffect(() => {
    if (!components?.drawer || behavior !== "update" || snapshotReady) return;

    const expectedSaved = servico?.arquivos?.length || 0;
    const loadedSaved = images.filter((img) => !img.file).length;

    // só tira snapshot quando imagens salvas já foram carregadas
    if (loadedSaved !== expectedSaved) return;

    originalServicoRef.current = {
      _id: servico?._id || "",
      data: normalizeServico(servico),
      imageCount: images.length,
    };

    setSnapshotReady(true);
  }, [components?.drawer, behavior, snapshotReady, servico, images]);

  const hasChanges = useMemo(() => {
    if (behavior === "create") return true;
    if (!snapshotReady || !originalServicoRef.current) return false;

    const current = {
      data: normalizeServico(servico),
      imageCount: images.length,
    };

    const original = {
      data: originalServicoRef.current.data,
      imageCount: originalServicoRef.current.imageCount,
    };

    return JSON.stringify(current) !== JSON.stringify(original);
  }, [behavior, snapshotReady, servico, images]);

  const isSaveDisabled =
    loading ||
    !requiredFilled ||
    (behavior === "update" && !hasChanges);

return (
  <div className="col">
    <TableComponent
      loading={form.filtering}
      title="Serviços"
      rows={servicosProcessados}
      columns={columns}
      buttonLabel="Novo Serviço"
      iconClass="mdi mdi-plus"
      onButtonClick={handleNovoServico}
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
      onRowClick={(servico) => {
        setImages([]);
        setRemovedImagePreviews([]);
        originalServicoRef.current = null;
        setSnapshotReady(false);

        dispatch(
          updateServico({
            behavior: "update",
            servico,
            form: {
              ...servico.form,
              disabled: false,
            },
          })
        );
        setComponent("drawer", true);
      }}
      checkboxSelection={true}
      renderExpandedRow={renderDetalhesServico}
    />
    {/* Drawer Component Controlado diretamente pelo estado do Redux */}
    <div
      style={{ display: "flex", flexDirection: "column", marginLeft: "16px" }}
    >
      <CustomDrawer
        show={components.drawer}
        anchor={isMobile || isTablet ? "bottom" : "right"}
        isOpen={components.drawer}
        onClose={() => setComponent("drawer", false)}
      >
        <div className="col-12">
          <h3>
            {behavior === "create" ? "Criar Novo" : "Atualizar"} Serviço
          </h3>
          {/* Aqui você pode adicionar inputs, formulários, etc */}
          <p>Verifique as informações antes de salvar:</p>
          <div className="row mt-3">
            <div className="form-group col-12 mb-3">
              <TextField
                label="Título"
                type="text"
                fullWidth
                variant="outlined"
                value={servico?.titulo || ""}
                placeholder="Digite o título do serviço"
                onChange={(e) => setServico("titulo", e.target.value)}
                InputProps={{
                  style: {
                    fontSize: "0.8rem", // Altere esse valor conforme quiser
                  },
                  startAdornment: (
                    <InputAdornment position="start">
                      <SubtitlesIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </div>
            <div className="form-group col-12 mb-3">
              <TextField
                label="R$ Preço"
                type="text"
                fullWidth
                variant="outlined"
                placeholder="Digite o preço do serviço"
                value={
                  isFocused ? servico?.preco : formatPreco(servico?.preco)
                } // Exibe sem casas decimais quando em foco
                onChange={handlePrecoChange}
                onFocus={() => setIsFocused(true)} // Ao focar no campo, remove as casas decimais
                onBlur={() => setIsFocused(false)} // Ao sair do campo, exibe com 2 casas decimais
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon />
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
                label="Recorrência (dias)"
                type="number"
                fullWidth
                variant="outlined"
                placeholder="Digite a recorrência do serviço"
                value={servico?.recorrencia || ""}
                onChange={(e) => setServico("recorrencia", e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DateRangeIcon />
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
                label="% Comissão"
                type="number"
                fullWidth
                variant="outlined"
                placeholder="Digite a comissão do serviço"
                value={servico?.comissao || ""}
                onChange={(e) => setServico("comissao", e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PercentIcon />
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
            <div className="form-group col-6 mb-2">
              <FormControl fullWidth variant="outlined">
                <InputLabel>Status</InputLabel>
                <Select
                  value={servico?.status || ""}
                  onChange={(e) => setServico("status", e.target.value)}
                  label="Status"
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
                  {behavior === "update" && (<MenuItem value="I">Inativo</MenuItem>)}
                </Select>
              </FormControl>
            </div>
            <div className="form-group col-6 mb-2">
              <FormControl fullWidth variant="outlined">
                <InputLabel>Tipo de Serviço</InputLabel>
                <Select
                  value={servico?.tipoServico || ""}
                  onChange={(e) => setServico("tipoServico", e.target.value)}
                  label="Tipo de Serviço"
                  startAdornment={
                    <InputAdornment position="start">
                      <ManageSearchIcon />
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
                  <MenuItem value="Barbearia">Barbearia</MenuItem>
                  {/* <MenuItem value="Cabeleireiro">Cabeleireiro</MenuItem>
                    <MenuItem value="Manicure">Manicure</MenuItem>
                    <MenuItem value="Pedicure">Pedicure</MenuItem> */}
                  <MenuItem value="Cuidados">Cuidados</MenuItem>
                  <MenuItem value="Crianças">Crianças</MenuItem>
                  {/* <MenuItem value="Outros">Outros</MenuItem> */}
                </Select>
              </FormControl>
            </div>
            <div className="form-group col-12 mb-3">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DemoContainer components={["TimePicker"]} >
                  <DemoItem>
                    <TimePicker
                      label="Duração"
                      value={servico?.duracao ? dayjs(servico.duracao) : null}// Valor inicial
                      onChange={(newValue) => {
                        //console.log("Novo valor de duração:", newValue); // Log do valor retornado
                        setServico('duracao', newValue ? newValue.toDate() : null); // Atualizando o estado com o valor correto
                      }}
                      sx={{ fontSize: "0.8rem" }} // Aplica no valor selecionado
                      ampm={false} // Formato de 24 horas
                      minutesStep={30} // Permitindo apenas 30 minutos, por exemplo
                      fullWidth
                      slotProps={{
                        textField: {
                          variant: "outlined",
                          fullWidth: true,
                          InputProps: {
                            sx: {
                              "& .MuiInputBase-input": {
                                padding: "10px 14px",
                                fontSize: "0.8rem",
                              },
                            },
                          },
                        },
                      }}
                    />
                  </DemoItem>
                </DemoContainer>
              </LocalizationProvider>
            </div>
            <div className="form-group col-12 mb-3">
              <TextField
                label="Descrição"
                type="text"
                multiline
                rows={5}
                fullWidth
                variant="outlined"
                placeholder="Digite a descrição do serviço"
                value={servico?.descricao || ""}
                onChange={(e) => setServico("descricao", e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionIcon />
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
              <Stack spacing={2} alignItems="center">
                {/* Preview das imagens em grid */}
                <Grid container spacing={2} justifyContent="center">
                  {images.map((img, index) => (
                    <Grid key={index} sx={{ position: "relative" }}>
                      <Box
                        sx={{ position: "relative", display: "inline-block" }}
                      >
                        <Avatar
                          src={img.preview}
                          alt={`Preview ${index}`}
                          sx={{ width: 100, height: 100 }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveImage(index)}
                          sx={{
                            position: "absolute",
                            top: -8,
                            right: -8,
                            backgroundColor: "#fff",
                            "&:hover": { backgroundColor: "#f5f5f5" },
                            boxShadow: 1,
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {/* Botão com ícone que abre o input de imagem */}
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<PhotoCamera />}
                >
                  Imagens do Serviço
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    multiple // ⬅️ permite múltiplas seleções
                    onChange={handleImageChange}
                  />
                </Button>
              </Stack>
            </div>
          </div>
        </div>
        <Button
          fullWidth
          variant="contained"
          onClick={handleClickSave}
          disabled={isSaveDisabled}
          startIcon={<SaveIcon />}
          size="large"
          sx={{
            mt: 3,
            backgroundColor: behavior === "create" ? "#2e7d32" : "#1565c0",
            "&:hover": {
              mt: 3,
              backgroundColor: behavior === " create" ? "#1b5e20" : "#0d47a1",
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
      content="Tem certeza que deseja excluir o serviço selecionado? Essa ação não poderá ser desfeita."
      onClose={handleCloseDialog}
      onConfirm={() => {
        if (selectedId) {
          const vinculoId = servicosProcessados[selectedId - 1]?.selectedIds;
          // console.log("Excluir:", servicosProcessados[selectedId -1]?.selectedIds);
          remove(vinculoId); // use o ID diretamente
        }
      }}
      confirmLabel="Excluir"
      cancelLabel="Cancelar"
    />
  </div>
);
};

export default Servicos;
