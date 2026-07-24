import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  PoButtonModule,
  PoFieldModule,
  PoLoadingModule,
  PoPageAction,
  PoPageModule,
  PoSelectOption,
  PoTableAction,
  PoTableColumn,
  PoTableModule,
} from '@po-ui/ng-components';
import { map } from 'rxjs';

import { ReduxStoreService } from '../../../../core/state/redux-store.service';
import { LookupModalComponent } from '../../components/lookup-modal/lookup-modal.component';
import {
  OrderFilterComponent,
  OrderFilterLookupRequest,
} from '../../components/order-filter/order-filter.component';
import {
  LookupItem,
  LookupRequest,
  OrderFilter,
  OrderListItem,
  PageSize,
} from '../../models/order-service.models';
import {
  clearLookup,
  initializeSearchRequested,
  lookupRequested,
  searchRequested,
} from '../../store/order-service.actions';
import {
  selectActiveFilter,
  selectOrderPagination,
  selectOrders,
  selectLookupItems,
  selectLookupPagination,
  selectLookupRequestState,
  selectSearchBusy,
  selectSearchReferenceData,
} from '../../store/order-service.selectors';

@Component({
  selector: 'app-order-list-page',
  standalone: true,
  imports: [
    AsyncPipe,
    FormsModule,
    PoPageModule,
    PoLoadingModule,
    PoTableModule,
    PoButtonModule,
    PoFieldModule,
    OrderFilterComponent,
    LookupModalComponent,
  ],
  templateUrl: './order-list.page.html',
  styleUrl: './order-list.page.scss',
})
export class OrderListPage implements OnInit {
  @ViewChild(OrderFilterComponent) private readonly filterComponent!: OrderFilterComponent;
  @ViewChild(LookupModalComponent) private readonly lookupModal!: LookupModalComponent;

  private readonly store = inject(ReduxStoreService);
  private readonly router = inject(Router);
  private activeLookup: OrderFilterLookupRequest | null = null;

  readonly referenceData$ = this.store.select(selectSearchReferenceData);
  readonly orders$ = this.store.select(selectOrders).pipe(map((items) => [...items]));
  readonly pagination$ = this.store.select(selectOrderPagination);
  readonly loading$ = this.store.select(selectSearchBusy);
  readonly lookupItems$ = this.store.select(selectLookupItems);
  readonly lookupPagination$ = this.store.select(selectLookupPagination);
  readonly lookupLoading$ = this.store
    .select(selectLookupRequestState)
    .pipe(map((request) => request.status === 'loading'));
  readonly pageSizeOptions: Array<PoSelectOption> = [
    { label: '10 registros', value: 10 },
    { label: '50 registros', value: 50 },
    { label: '100 registros', value: 100 },
  ];

  readonly pageActions: Array<PoPageAction> = [
    {
      label: 'Nova ordem',
      icon: 'an an-plus',
      kind: 'primary',
      action: (): void => this.openNewOrder(),
    },
  ];

  readonly tableActions: Array<PoTableAction> = [
    {
      label: 'Editar',
      icon: 'an an-pencil-simple',
      action: (item: OrderListItem): void => this.editOrder(item),
      disabled: (item: OrderListItem): boolean => !item.editable,
    },
  ];

  readonly columns: Array<PoTableColumn> = [
    {
      property: 'status',
      label: 'Situação',
      type: 'label',
      width: '130px',
      labels: [
        { value: 'P', color: 'caption-tag-07', label: 'Pendente' },
        { value: 'C', color: 'caption-tag-08', label: 'Cancelada' },
        { value: 'L', color: 'caption-tag-13', label: 'Liberada' },
      ],
    },
    { property: 'order', label: 'Ordem', width: '120px' },
    { property: 'plate', label: 'Placa', width: '130px' },
    { property: 'type', label: 'Tipo', width: '100px' },
    {
      property: 'originalDate',
      label: 'Data',
      type: 'date',
      format: 'dd/MM/yyyy',
      width: '120px',
    },
    { property: 'assetDescription', label: 'Bem' },
    { property: 'serviceDescription', label: 'Serviço' },
  ];

  ngOnInit(): void {
    this.store.dispatch(initializeSearchRequested());
  }

  search(filter: OrderFilter): void {
    const { pageSize } = this.store.snapshot(selectOrderPagination);
    this.store.dispatch(searchRequested({ filter, page: 1, pageSize }));
  }

  openLookup(request: OrderFilterLookupRequest): void {
    this.activeLookup = request;
    this.lookupModal.open(request.title, request.type, request.filter);
  }

  searchLookup(request: LookupRequest): void {
    this.store.dispatch(lookupRequested(request));
  }

  selectLookup(item: LookupItem): void {
    if (this.activeLookup) {
      this.filterComponent.applyLookup(this.activeLookup.field, item);
    }
  }

  closeLookup(): void {
    this.activeLookup = null;
    this.store.dispatch(clearLookup());
  }

  previousPage(page: number): void {
    this.goToPage(page - 1);
  }

  nextPage(page: number): void {
    this.goToPage(page + 1);
  }

  changePageSize(value: string | number): void {
    const pageSize = this.toPageSize(value);
    const filter = this.store.snapshot(selectActiveFilter);
    if (filter?.branch) {
      this.store.dispatch(searchRequested({ filter, page: 1, pageSize }));
    }
  }

  private openNewOrder(): void {
    void this.router.navigate(['/ordens/nova']);
  }

  private editOrder(item: OrderListItem): void {
    void this.router.navigate(['/ordens', item.branch, item.order]);
  }

  private goToPage(page: number): void {
    const filter = this.store.snapshot(selectActiveFilter);
    const { pageSize } = this.store.snapshot(selectOrderPagination);
    if (filter?.branch && page >= 1) {
      this.store.dispatch(searchRequested({ filter, page, pageSize }));
    }
  }

  private toPageSize(value: string | number): PageSize {
    const parsed = Number(value);
    return parsed === 50 || parsed === 100 ? parsed : 10;
  }
}
