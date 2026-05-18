import { takeLatest, all, call, put, select } from "redux-saga/effects";
import {
  updateColaborador,
  allColaboradores as allColaboradoresActrions,
  resetColaborador,
  setAlerta,
  updateUser,
  updateMyAccountSuccess,
  loadMyAccountSuccess
} from "./actions";
import types from "./types";
import api from "../../../services/api";
import history from "../../../history";
import { signOutClerk } from "../../../utils/clerk";
import { delay } from "redux-saga/effects";


const toStr = (v) => String(v || "").trim();

const uniqueIds = (arr = []) => [...new Set((arr || []).map(toStr).filter(Boolean))];

const getSelectedSalaoIds = (colaborador) =>
  uniqueIds([
    ...(Array.isArray(colaborador?.empresasIds) ? colaborador.empresasIds : []),
    // fallback para compatibilidade antiga
    colaborador?.salaoId,
  ]);

const getSalaoIdFromVinculo = (v) => toStr(v?.salaoId);
const getVinculoIdFromVinculo = (v) => toStr(v?.vinculoId || v?._id);

const isDuplicateRelationshipError = (res) =>
  !!res?.error && /já cadastrado/i.test(String(res?.message || ""));


export function* allColaboradores() {
  const { form, user } = yield select((state) => state.colaborador);

  // cobre os 2 formatos possíveis do user no store
  const userNorm = user?.user ? user.user : user;
  const isYoda = userNorm?.funcao === "yoda";
  const salaoId = user?.salaoId;

  try {
    yield put(updateColaborador({ form: { ...form, filtering: true } }));

    const endpoint = isYoda
      ? "/colaborador/all"
      : `/colaborador/salao/${salaoId}`;

    const { data: res } = yield call(api.get, endpoint);

    yield put(updateColaborador({ form: { ...form, filtering: false } }));

    if (res?.error) {
      alert(res.message);
      return false;
    }

    yield put(updateColaborador({ colaboradores: res?.colaboradores || [] }));
  } catch (err) {
    yield put(updateColaborador({ form: { ...form, filtering: false } }));
    alert(err.message);
  }
}

export function* filterColaboradores({ filters }) {
  const { form, colaborador: colaboradorAtual, colaboradores, servicos } = yield select(
    (state) => state.colaborador
  );

  try {
    yield put(updateColaborador({ form: { ...form, filtering: true } }));

    const emailBusca = (filters?.email || "").trim().toLowerCase();

    const { data: res } = yield call(api.post, "/colaborador/filter", {
      ...filters,
      email: emailBusca,
    });

    console.log("res", res)

    if (res?.error) {
      yield put(updateColaborador({ form: { ...form, filtering: false } }));
      alert(res.message);
      return false;
    }

    const encontradoApi = res?.colaboradores?.[0];
    const encontradoLocal = (colaboradores || []).find(
      (c) => (c?.email || "").trim().toLowerCase() === emailBusca
    );

    // prioridade API
    const found = encontradoApi || encontradoLocal;

    if (found) {
      const vinculoNormalizado =
        typeof found?.vinculo === "string"
          ? found.vinculo
          : found?.vinculo?.status || found?.status || "A";

      const fontesEspecialidades = [
        ...(Array.isArray(found?.especialidades) ? found.especialidades : []),
        ...(Array.isArray(found?.vinculo?.especialidades) ? found.vinculo.especialidades : []),
        ...(Array.isArray(encontradoApi?.especialidades) ? encontradoApi.especialidades : []),
        ...(Array.isArray(encontradoApi?.vinculo?.especialidades) ? encontradoApi.vinculo.especialidades : []),
        ...(Array.isArray(encontradoLocal?.especialidades) ? encontradoLocal.especialidades : []),
        ...(Array.isArray(encontradoLocal?.vinculo?.especialidades) ? encontradoLocal.vinculo.especialidades : []),
      ];

      const servicosNorm = (servicos || []).map((s) => ({
        value: String(s?.value || s?._id || s?.id || ""),
        label: String(s?.label || s?.nome || "").trim().toLowerCase(),
      }));

      const especialidadesNormalizadas = [
        ...new Set(
          fontesEspecialidades
            .map((e) => {
              if (!e) return null;

              // 1) tenta por ID
              let id =
                typeof e === "string"
                  ? e
                  : e?.value ||
                  e?._id ||
                  e?.id ||
                  e?.servicoId?._id ||
                  e?.servicoId ||
                  e?.servico?._id ||
                  e?.servico?.id;

              if (id) return String(id);

              // 2) fallback por NOME (quando API retorna só nome)
              const nome =
                (typeof e === "string" ? e : e?.label || e?.nome || e?.servico?.nome || e?.servicoId?.nome || "")
                  .trim()
                  .toLowerCase();

              if (!nome) return null;

              const servicoMatch = servicosNorm.find((s) => s.label === nome);
              return servicoMatch?.value || null;
            })
            .filter(Boolean)
        ),
      ];

      const colaboradorNormalizado = {
        ...colaboradorAtual,
        ...found,
        vinculo: vinculoNormalizado,
        especialidades: especialidadesNormalizadas,
        telefone: {
          area: found?.telefone?.area || "",
          numero: found?.telefone?.numero || "",
        },
        identificacao: {
          tipoD: found?.identificacao?.tipoD || "",
          numero: found?.identificacao?.numero || "",
        },
        endereco: {
          cep: found?.endereco?.cep || "",
          logradouro: found?.endereco?.logradouro || "",
          numero: found?.endereco?.numero || "",
          bairro: found?.endereco?.bairro || "",
          cidade: {
            nome: found?.endereco?.cidade?.nome || "",
          },
        },
      };

      yield put(
        updateColaborador({
          behavior: "update",
          colaborador: colaboradorNormalizado,
          form: { ...form, filtering: false, disabled: false },
        })
      );
    } else {
      yield put(
        updateColaborador({
          behavior: "create",
          colaborador: {
            ...colaboradorAtual,
            email: emailBusca || colaboradorAtual?.email || "",
            vinculo: "A",
            especialidades: [],
          },
          form: { ...form, filtering: false, disabled: false },
        })
      );
    }
  } catch (err) {
    alert(err.message);
    yield put(updateColaborador({ form: { ...form, filtering: false } }));
  }
}

export function* addColaborador() {
  const { form, colaborador, components, behavior, user } = yield select(
    (state) => state.colaborador
  );

  const salaoIdUser = user?.salaoId;

  try {
    yield put(updateColaborador({ form: { ...form, saving: true } }));

    const selectedSalaoIds = getSelectedSalaoIds(colaborador);
    console.log("Sagas Id Salao: ", selectedSalaoIds)
    if (!selectedSalaoIds.length) {
      yield put(
        setAlerta({
          open: true,
          severity: "warning",
          title: "Atenção",
          message: "Selecione ao menos uma empresa.",
        })
      );
      yield put(updateColaborador({ form: { ...form, saving: false } }));
      return;
    }

    let res = { error: false };

    if (behavior === "create") {
      // 1) cria no primeiro salão (ou vincula se já existir por email/telefone)
      const firstSalaoId = selectedSalaoIds[0];
      const salaoIdX = firstSalaoId || salaoIdUser
      const firstResponse = yield call(api.post, "/colaborador", {
        salaoId: salaoIdX,
        colaborador,
      });
      res = firstResponse.data;

      if (res?.error && !isDuplicateRelationshipError(res)) {
        throw new Error(res.message || "Erro ao criar colaborador.");
      }

      // 2) cria vínculos adicionais para os outros salões selecionados
      for (const salaoId of selectedSalaoIds.slice(1)) {
        const extraResponse = yield call(api.post, "/colaborador", {
          salaoId,
          colaborador,
        });
        const extraRes = extraResponse.data;

        // se já existe vínculo nesse salão, ignora; se outro erro, falha
        if (extraRes?.error && !isDuplicateRelationshipError(extraRes)) {
          throw new Error(extraRes.message || "Erro ao criar vínculos adicionais.");
        }
      }
    } else {
      // UPDATE: sincroniza vínculos na ordem correta

      // pega vínculos completos/atuais do colaborador (todos os salões)
      const { data: fullRes } = yield call(api.post, "/colaborador/filter", {
        filters: { email: colaborador.email }, // importante: nested em filters
      });

      const vinculosServidor = fullRes?.colaboradores?.[0]?.vinculos || [];
      const currentVinculos = vinculosServidor.length
        ? vinculosServidor
        : (Array.isArray(colaborador?.vinculos) ? colaborador.vinculos : []);

      const currentBySalao = new Map(
        currentVinculos
          .map((v) => [getSalaoIdFromVinculo(v), v])
          .filter(([salaoId]) => !!salaoId)
      );

      const currentSalaoIds = [...currentBySalao.keys()];

      const toRemove = currentSalaoIds.filter((id) => !selectedSalaoIds.includes(id));

      // 1) remove vínculos desmarcados
      for (const salaoId of toRemove) {
        const vinculo = currentBySalao.get(salaoId);
        const vinculoId = getVinculoIdFromVinculo(vinculo);

        if (vinculoId) {
          console.log("Tentou deletar o vinculo: ", vinculoId)
          const delResponse = yield call(api.delete, `/colaborador/vinculo/${vinculoId}`);
          const delRes = delResponse.data;
          if (delRes?.error) {
            throw new Error(delRes.message || "Erro ao remover vínculo.");
          }
        }
      }

      // 2) garante vínculo para cada empresa selecionada
      // (se não existir cria; se existir mantém/atualiza status no backend)
      for (const salaoId of selectedSalaoIds) {
        console.log("Sagas salaoId:", salaoId)
        const upsertResponse = yield call(api.post, "/colaborador", {
          salaoId,
          colaborador,
        });
        const upsertRes = upsertResponse.data;

        if (upsertRes?.error && !isDuplicateRelationshipError(upsertRes)) {
          throw new Error(upsertRes.message || "Erro ao sincronizar vínculos.");
        }
      }

      // 3) atualiza somente perfil + especialidades (não força vínculo aqui)
      const {
        _id,
        id,
        selectedIx,
        statusFormat,
        telefoneFormatado,
        vinculos,
        empresasIds,
        vinculoId,
        vinculo,
        salaoId,
        ...perfilLimpo
      } = colaborador;

      const response = yield call(api.put, `/colaborador/${colaborador._id}`, {
        ...perfilLimpo,
        especialidades: colaborador.especialidades || [],
      });

      res = response.data;
      if (res?.error) {
        throw new Error(res.message || "Erro ao atualizar colaborador.");
      }
    }

    yield put(updateColaborador({ form: { ...form, saving: false } }));
    yield put(allColaboradoresActrions());
    yield put(updateColaborador({ components: { ...components, drawer: false } }));
    yield put(resetColaborador());
    yield put(
      setAlerta({
        open: true,
        severity: "success",
        title: "Sucesso",
        message:
          behavior === "create"
            ? "Colaborador cadastrado com sucesso!"
            : "Colaborador atualizado com sucesso!",
      })
    );
  } catch (err) {
    yield put(updateColaborador({ form: { ...form, saving: false } }));
    yield put(
      setAlerta({
        open: true,
        severity: "error",
        title: "Erro",
        message: err.message,
      })
    );
  }
}

export function* unlinkColaborador({ vinculoId }) {
  const { form, components } = yield select((state) => state.colaborador);

  try {
    yield put(updateColaborador({ form: { ...form, saving: true } }));

    const { data: res } = yield call(
      api.delete,
      `/colaborador/vinculo/${vinculoId}`
    );

    yield put(
      updateColaborador({
        form: { ...form, saving: false },
      })
    );

    //console.log("Resposta da API:", res);

    if (res.error) {
      yield put(
        setAlerta({
          open: true,
          severity: "error",
          title: "Erro",
          message: res.message,
        })
      );
      return false;
    }

    yield put(allColaboradoresActrions());
    yield put(
      updateColaborador({
        components: { ...components, drawer: false, confirmDelete: false },
      })
    );
    yield put(resetColaborador());

    yield put(
      setAlerta({
        open: true,
        severity: "success",
        title: "Sucesso",
        message: "Colaborador excluído!",
      })
    );

    // dispara o alerta de sucesso
  } catch (err) {
    // dispara o alerta de erro:
    yield put(
      setAlerta({
        open: true,
        severity: "error",
        title: "Erro",
        message: err.message,
      })
    );
    yield put(updateColaborador({ form: { ...form, saving: false } }));
  }
}

export function* allServicos() {
  const { form, user } = yield select((state) => state.colaborador);

  const isYoda = user?.funcao === "yoda";
  const salaoId = user?.salaoId;

  try {
    yield put(updateColaborador({ form: { ...form, filtering: true } }));

    const endpoint = isYoda
      ? "/servico/all"
      : `/salao/servicos/${encodeURIComponent(salaoId)}`;

    const { data: res } = yield call(api.get, endpoint);

    yield put(updateColaborador({ form: { ...form, filtering: false } }));

    if (res.error) {
      yield put(
        setAlerta({
          open: true,
          severity: "error",
          title: "Erro",
          message: res.message,
        })
      );
      return false;
    }

    const servicosNormalizados = (res?.servicos || [])
      .map((s) => {
        const value = String(
          s?.value || s?._id || s?.id || s?.servicoId?._id || s?.servicoId || ""
        );
        const label = s?.label || s?.nome || s?.titulo || s?.descricao || "Serviço";
        return value ? { ...s, value, label } : null;
      })
      .filter(Boolean);

    yield put(updateColaborador({ servicos: servicosNormalizados }));

  } catch (err) {
    // dispara o alerta de erro:
    yield put(
      setAlerta({
        open: true,
        severity: "error",
        title: "Erro",
        message: err.message,
      })
    );
    yield put(updateColaborador({ form: { ...form, filtering: false } }));
  }
}

export function* checkUser({email}) {
  try {
    if (!email) throw new Error("Email ausente no checkUser");

    const { data: res } = yield call(
      api.get,
      `/colaborador/check/${encodeURIComponent(email)}`
    );

    if (res.error) {
      yield put(
        setAlerta({
          open: true,
          severity: "error",
          title: "Erro",
          message: res.message,
        })
      );
      return false;
    }

    if (res.colaborador) {
      console.log("Res: ", res.colaborador)
      const colaborador = res.colaborador;
      const funcao = colaborador.funcao || "";
      const isYoda = funcao === "yoda";

      yield put(
        updateUser({
          colaboradorId: colaborador._id,
          email: colaborador.email,
          firstName: colaborador.nome,
          lastName: colaborador.sobrenome,
          imageUrl: colaborador.foto,
          especialidades: colaborador.especialidades || [],
          funcao,
          salaoId: colaborador.salaoId || colaborador.vinculos?.[0]?.salaoId || "",
          vinculoId: colaborador.vinculoId || colaborador.vinculos?.[0]?.vinculoId || "",
          vinculo: colaborador.vinculo || colaborador.vinculos?.[0]?.status || "",
        })
      );

      history.push(isYoda ? "/empresas" : "/dashboard");
    } else {
      yield put(
        setAlerta({
          open: true,
          severity: "error",
          title: "Erro",
          message: "Colaborador não cadastrado no sistema! Fale com o administrador!",
        })
      );

      yield delay(5000);

      yield call(signOutClerk);
      history.push("/");
    }
  } catch (err) {
    yield put(
      setAlerta({
        open: true,
        severity: "error",
        title: "Erro",
        message: err.message,
      })
    );
  }
}

export function* updateMyAccount({ payload, fotoFile }) {
  const { form, user } = yield select((state) => state.colaborador);

  const salaoId = user?.salaoId;

  //console.log("fotoFile", fotoFile)

  try {
    yield put(updateColaborador({ form: { ...form, saving: true } }));

    const especialidadesNormalizadas = (
      Array.isArray(payload?.especialidades) && payload.especialidades.length
        ? payload.especialidades
        : (user?.especialidades || [])
    )
      .map((x) => String(x))
      .filter(Boolean);

    // mesmo núcleo do update de colaboradores
    const baseUpdate = {
      vinculo: payload?.vinculo || user?.vinculo || "A",
      vinculoId: payload?.vinculoId || user?.vinculoId,
      especialidades: especialidadesNormalizadas,
    };

    // se seu backend também atualiza dados de perfil nessa rota, mantenha:
    const perfil = {
      nome: payload?.nome || "",
      sobrenome: payload?.sobrenome || "",
      sexo: payload?.sexo || "",
      foto: fotoFile || "",
      telefone: {
        area: payload?.telefone?.area || "",
        numero: payload?.telefone?.numero || "",
      },
      identificacao: {
        tipoD: payload?.identificacao?.tipoD || "",
        numero: payload?.identificacao?.numero || "",
      },
      endereco: {
        cep: payload?.endereco?.cep || "",
        logradouro: payload?.endereco?.logradouro || "",
        numero: payload?.endereco?.numero || "",
        bairro: payload?.endereco?.bairro || "",
        cidade: { nome: payload?.endereco?.cidade?.nome || "" },
      },
    };

    let res;
    if (fotoFile instanceof File) {
      const formData = new FormData();

      formData.append("salaoId", salaoId);
      formData.append("colaborador", JSON.stringify({ ...baseUpdate, ...perfil }));
      formData.append("foto", fotoFile);
      // for (let [key, value] of formData.entries()) {
      //   console.log(key, value);
      // }

      const response = yield call(api.put, `/colaborador/${user._id}`, formData);
      res = response.data;
    } else {
      const response = yield call(api.put, `/colaborador/${user._id}`, {
        ...baseUpdate,
        ...perfil,
      });
      res = response.data;
    }

    yield put(updateColaborador({ form: { ...form, saving: false } }));

    if (res.error) {
      yield put(setAlerta({ open: true, severity: "error", title: "Erro", message: res.message }));
      return;
    }

    const updatedUser = {
      ...res.colaborador,
      especialidades: especialidadesNormalizadas,
      foto: res?.colaborador?.foto || res?.colaborador?.fotoUrl || "",
    };

    yield put(updateUser({ user: updatedUser }));
    yield put(updateMyAccountSuccess(updatedUser));
    yield put(setAlerta({ open: true, severity: "success", title: "Sucesso", message: "Conta atualizada com sucesso!" }));
  } catch (err) {
    yield put(updateColaborador({ form: { ...form, saving: false } }));
    yield put(setAlerta({ open: true, severity: "error", title: "Erro", message: err.message }));
  }
}

export function* loadMyAccount({ email }) {
  const { form } = yield select((state) => state.colaborador);

  try {
    if (!email) return;

    yield put(updateColaborador({ form: { ...form, filtering: true } }));

    const { data: res } = yield call(
      api.get,
      `/colaborador/check/${encodeURIComponent(email)}`
    );

    const colaborador = res?.colaborador
      ? {
        ...res.colaborador,
        especialidades: (res.colaborador.especialidades || []).map((x) => String(x)),
      }
      : null;

    if (!colaborador) return;

    yield put(loadMyAccountSuccess(colaborador));
    yield put(updateUser(colaborador));

    yield put(updateColaborador({ form: { ...form, filtering: false } }));

    if (res?.error || !res?.colaborador) return; // silencioso na account

  } catch (err) {
    yield put(updateColaborador({ form: { ...form, filtering: false } }));
  }
}

export default all([
  takeLatest(types.ALL_COLABORADORES, allColaboradores),
  takeLatest(types.FILTER_COLABORADORES, filterColaboradores),
  takeLatest(types.ADD_COLABORADOR, addColaborador),
  takeLatest(types.UNLINK_COLABORADOR, unlinkColaborador),
  takeLatest(types.ALL_SERVICOS, allServicos),
  takeLatest(types.CHECK_USER, checkUser),
  takeLatest(types.UPDATE_MY_ACCOUNT_REQUEST, updateMyAccount),
  takeLatest(types.LOAD_MY_ACCOUNT_REQUEST, loadMyAccount),
]);
