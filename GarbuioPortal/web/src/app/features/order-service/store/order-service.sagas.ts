import { SagaGenerator, all, call, put, takeLatest, takeLeading } from 'typed-redux-saga';

import { normalizeApiError } from '../../../core/errors/api-error';
import { NotificationPort } from '../../../core/notifications/notification-port';
import { OrderServiceApiService } from '../services/order-service-api.service';
import {
  deleteSupplyFailed,
  deleteSupplyRequested,
  deleteSupplySucceeded,
  initializeSearchFailed,
  initializeSearchRequested,
  initializeSearchSucceeded,
  loadEditorFailed,
  loadEditorRequested,
  loadEditorSucceeded,
  loadSupplyEditorFailed,
  loadSupplyEditorRequested,
  loadSupplyEditorSucceeded,
  lookupFailed,
  lookupRequested,
  lookupSucceeded,
  saveFailed,
  saveRequested,
  saveSucceeded,
  saveSupplyFailed,
  saveSupplyRequested,
  saveSupplySucceeded,
  searchFailed,
  searchRequested,
  searchSucceeded,
} from './order-service.actions';
import { OrderServiceActionTypes as Types } from './order-service.types';

export interface OrderServiceSagaDependencies {
  readonly api: OrderServiceApiService;
  readonly notifications: NotificationPort;
}

export function* orderServiceSagas(
  dependencies: OrderServiceSagaDependencies,
): SagaGenerator<void> {
  yield* all([
    takeLatest(Types.INITIALIZE_SEARCH_REQUESTED, initializeSearchWorker, dependencies),
    takeLatest(Types.SEARCH_REQUESTED, searchWorker, dependencies),
    takeLatest(Types.LOAD_EDITOR_REQUESTED, loadEditorWorker, dependencies),
    takeLeading(Types.SAVE_REQUESTED, saveWorker, dependencies),
    takeLatest(Types.LOAD_SUPPLY_EDITOR_REQUESTED, loadSupplyEditorWorker, dependencies),
    takeLeading(Types.SAVE_SUPPLY_REQUESTED, saveSupplyWorker, dependencies),
    takeLeading(Types.DELETE_SUPPLY_REQUESTED, deleteSupplyWorker, dependencies),
    takeLatest(Types.LOOKUP_REQUESTED, lookupWorker, dependencies),
  ]);
}

function* initializeSearchWorker(
  dependencies: OrderServiceSagaDependencies,
  _action: ReturnType<typeof initializeSearchRequested>,
): SagaGenerator<void> {
  try {
    const data = yield* call([dependencies.api, dependencies.api.loadSearchReferenceData]);
    yield* put(initializeSearchSucceeded(data));
    if (data.initialFilter.branch) {
      yield* put(searchRequested({ filter: data.initialFilter, page: 1, pageSize: 10 }));
    }
  } catch (error: unknown) {
    const apiError = normalizeApiError(error);
    yield* put(initializeSearchFailed(apiError));
    yield* call([dependencies.notifications, dependencies.notifications.error], apiError.message);
  }
}

function* searchWorker(
  dependencies: OrderServiceSagaDependencies,
  action: ReturnType<typeof searchRequested>,
): SagaGenerator<void> {
  try {
    const result = yield* call([dependencies.api, dependencies.api.searchOrders], action.payload);
    yield* put(searchSucceeded(result, action.payload));
  } catch (error: unknown) {
    const apiError = normalizeApiError(error);
    yield* put(searchFailed(apiError));
    yield* call([dependencies.notifications, dependencies.notifications.error], apiError.message);
  }
}

function* loadEditorWorker(
  dependencies: OrderServiceSagaDependencies,
  action: ReturnType<typeof loadEditorRequested>,
): SagaGenerator<void> {
  try {
    const editor = yield* call(
      [dependencies.api, dependencies.api.loadOrderEditor],
      action.payload.branch,
      action.payload.order,
    );
    yield* put(loadEditorSucceeded(editor));
  } catch (error: unknown) {
    const apiError = normalizeApiError(error);
    yield* put(loadEditorFailed(apiError));
    yield* call([dependencies.notifications, dependencies.notifications.error], apiError.message);
  }
}

function* saveWorker(
  dependencies: OrderServiceSagaDependencies,
  action: ReturnType<typeof saveRequested>,
): SagaGenerator<void> {
  try {
    const result =
      action.payload.mode === 'create'
        ? yield* call([dependencies.api, dependencies.api.createOrder], action.payload)
        : yield* call([dependencies.api, dependencies.api.updateOrder], action.payload);

    yield* put(saveSucceeded(result));
    yield* call(
      [dependencies.notifications, dependencies.notifications.success],
      'Ordem de serviço salva com sucesso.',
    );
    yield* put(loadEditorRequested({ branch: result.branch, order: result.order }));
  } catch (error: unknown) {
    const apiError = normalizeApiError(error);
    yield* put(saveFailed(apiError));
    yield* call([dependencies.notifications, dependencies.notifications.error], apiError.message);
  }
}

function* loadSupplyEditorWorker(
  dependencies: OrderServiceSagaDependencies,
  action: ReturnType<typeof loadSupplyEditorRequested>,
): SagaGenerator<void> {
  try {
    const editor = yield* call(
      [dependencies.api, dependencies.api.loadSupplyEditor],
      action.payload.branch,
      action.payload.order,
      action.payload.orderServiceId,
      action.payload.sequence,
    );
    yield* put(loadSupplyEditorSucceeded(editor));
  } catch (error: unknown) {
    const apiError = normalizeApiError(error);
    yield* put(loadSupplyEditorFailed(apiError));
    yield* call([dependencies.notifications, dependencies.notifications.error], apiError.message);
  }
}

function* saveSupplyWorker(
  dependencies: OrderServiceSagaDependencies,
  action: ReturnType<typeof saveSupplyRequested>,
): SagaGenerator<void> {
  try {
    const result =
      action.payload.mode === 'create'
        ? yield* call([dependencies.api, dependencies.api.createSupply], action.payload)
        : yield* call([dependencies.api, dependencies.api.updateSupply], action.payload);

    yield* put(saveSupplySucceeded(result));
    yield* call(
      [dependencies.notifications, dependencies.notifications.success],
      'Insumo salvo com sucesso.',
    );
    yield* put(
      loadEditorRequested({
        branch: action.payload.value.branch,
        order: result.order,
      }),
    );
  } catch (error: unknown) {
    const apiError = normalizeApiError(error);
    yield* put(saveSupplyFailed(apiError));
    yield* call([dependencies.notifications, dependencies.notifications.error], apiError.message);
  }
}

function* deleteSupplyWorker(
  dependencies: OrderServiceSagaDependencies,
  action: ReturnType<typeof deleteSupplyRequested>,
): SagaGenerator<void> {
  try {
    yield* call([dependencies.api, dependencies.api.deleteSupply], action.payload);
    yield* put(deleteSupplySucceeded(action.payload));
    yield* call(
      [dependencies.notifications, dependencies.notifications.success],
      'Insumo excluído com sucesso.',
    );
    yield* put(
      loadEditorRequested({
        branch: action.payload.branch,
        order: action.payload.order,
      }),
    );
  } catch (error: unknown) {
    const apiError = normalizeApiError(error);
    yield* put(deleteSupplyFailed(apiError));
    yield* call([dependencies.notifications, dependencies.notifications.error], apiError.message);
  }
}

function* lookupWorker(
  dependencies: OrderServiceSagaDependencies,
  action: ReturnType<typeof lookupRequested>,
): SagaGenerator<void> {
  try {
    const result = yield* call([dependencies.api, dependencies.api.searchLookup], action.payload);
    yield* put(lookupSucceeded(result, action.payload));
  } catch (error: unknown) {
    const apiError = normalizeApiError(error);
    yield* put(lookupFailed(apiError));
    yield* call([dependencies.notifications, dependencies.notifications.error], apiError.message);
  }
}
