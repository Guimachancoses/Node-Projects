import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';

import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import {
  DeleteSupplyRequest,
  LookupItem,
  LookupRequest,
  OrderEditorData,
  OrderListItem,
  OrderSearchRequest,
  OrderSearchReferenceData,
  PaginatedResult,
  SaveOrderRequest,
  SaveOrderResult,
  SaveSupplyRequest,
  SaveSupplyResult,
  SupplyEditorData,
} from '../models/order-service.models';

@Injectable({ providedIn: 'root' })
export class OrderServiceApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
  ) {}

  loadSearchReferenceData(): Promise<OrderSearchReferenceData> {
    return this.get<OrderSearchReferenceData>('reference-data');
  }

  searchOrders(request: OrderSearchRequest): Promise<PaginatedResult<OrderListItem>> {
    const { filter } = request;
    const params = new HttpParams()
      .set('startDate', filter.startDate)
      .set('endDate', filter.endDate)
      .set('branch', filter.branch)
      .set('status', filter.status)
      .set('order', filter.order)
      .set('plate', filter.plate)
      .set('page', request.page)
      .set('pageSize', request.pageSize);
    return this.get<PaginatedResult<OrderListItem>>('orders', params);
  }

  loadOrderEditor(branch?: string, order?: string): Promise<OrderEditorData> {
    if (!branch || !order) {
      return this.get<OrderEditorData>('orders/new');
    }
    return this.get<OrderEditorData>(
      `orders/${encodeURIComponent(branch)}/${encodeURIComponent(order)}`,
    );
  }

  createOrder(request: SaveOrderRequest): Promise<SaveOrderResult> {
    return this.post<SaveOrderResult>('orders', request);
  }

  updateOrder(request: SaveOrderRequest): Promise<SaveOrderResult> {
    const { branch, order } = request.value;
    return this.put<SaveOrderResult>(
      `orders/${encodeURIComponent(branch)}/${encodeURIComponent(order)}`,
      request,
    );
  }

  loadSupplyEditor(
    branch: string,
    order: string,
    orderServiceId: number,
    sequence?: number,
  ): Promise<SupplyEditorData> {
    let params = new HttpParams().set('orderServiceId', orderServiceId);
    if (sequence !== undefined) {
      params = params.set('sequence', sequence);
    }
    return this.get<SupplyEditorData>(
      `orders/${encodeURIComponent(branch)}/${encodeURIComponent(order)}/supplies/editor`,
      params,
    );
  }

  createSupply(request: SaveSupplyRequest): Promise<SaveSupplyResult> {
    const { branch, order } = request.value;
    return this.post<SaveSupplyResult>(
      `orders/${encodeURIComponent(branch)}/${encodeURIComponent(order)}/supplies`,
      request,
    );
  }

  updateSupply(request: SaveSupplyRequest): Promise<SaveSupplyResult> {
    const { branch, order, sequence } = request.value;
    return this.put<SaveSupplyResult>(
      `orders/${encodeURIComponent(branch)}/${encodeURIComponent(order)}/supplies/${sequence}`,
      request,
    );
  }

  async deleteSupply(request: DeleteSupplyRequest): Promise<void> {
    const params = new HttpParams().set('orderServiceId', request.orderServiceId);
    await firstValueFrom(
      this.http
        .delete<void>(
          this.url(
            `orders/${encodeURIComponent(request.branch)}/${encodeURIComponent(request.order)}/supplies/${request.sequence}`,
          ),
          { params },
        )
        .pipe(timeout(this.config.requestTimeoutMs)),
    );
  }

  searchLookup(request: LookupRequest): Promise<PaginatedResult<LookupItem>> {
    const params = new HttpParams()
      .set('filter', request.filter)
      .set('query', request.query)
      .set('page', request.page)
      .set('pageSize', request.pageSize);
    return this.get<PaginatedResult<LookupItem>>(
      `lookups/${encodeURIComponent(request.type)}`,
      params,
    );
  }

  private get<T>(path: string, params?: HttpParams): Promise<T> {
    return firstValueFrom(
      this.http.get<T>(this.url(path), { params }).pipe(timeout(this.config.requestTimeoutMs)),
    );
  }

  private post<T>(path: string, body: object): Promise<T> {
    return firstValueFrom(
      this.http.post<T>(this.url(path), body).pipe(timeout(this.config.requestTimeoutMs)),
    );
  }

  private put<T>(path: string, body: object): Promise<T> {
    return firstValueFrom(
      this.http.put<T>(this.url(path), body).pipe(timeout(this.config.requestTimeoutMs)),
    );
  }

  private url(path: string): string {
    return `${this.config.protheusApiBaseUrl}/${path}`;
  }
}
