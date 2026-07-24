import { AsyncPipe, Location } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PoButtonModule,
  PoLoadingModule,
  PoModalAction,
  PoModalComponent,
  PoModalModule,
  PoNotificationService,
  PoPageAction,
  PoPageModule,
  PoTableAction,
  PoTableColumn,
  PoTableModule,
  PoWidgetModule,
} from '@po-ui/ng-components';
import { filter, map } from 'rxjs';

import { ReduxStoreService } from '../../../../core/state/redux-store.service';
import { LookupModalComponent } from '../../components/lookup-modal/lookup-modal.component';
import {
  LookupOpenEvent,
  OrderFormComponent,
  OrderLookupField,
  SupplyLookupField,
} from '../../components/order-form/order-form.component';
import { SupplyFormComponent } from '../../components/supply-form/supply-form.component';
import {
  DeleteSupplyRequest,
  LookupItem,
  LookupRequest,
  OrderEditorData,
  SaveOrderRequest,
  SaveSupplyRequest,
  SupplyListItem,
} from '../../models/order-service.models';
import {
  clearLookup,
  closeSupplyEditor,
  deleteSupplyRequested,
  loadEditorRequested,
  loadSupplyEditorRequested,
  lookupRequested,
  resetSaveResult,
  saveRequested,
  saveSupplyRequested,
} from '../../store/order-service.actions';
import {
  selectDeleteSupplyRequest,
  selectEditor,
  selectEditorBusy,
  selectLastSaveResult,
  selectLookupItems,
  selectLookupPagination,
  selectLookupRequestState,
  selectSaveRequest,
  selectSaveSupplyRequest,
  selectSupplyEditor,
} from '../../store/order-service.selectors';

interface ActiveLookup {
  readonly scope: 'order' | 'supply';
  readonly field: OrderLookupField | SupplyLookupField;
}

@Component({
  selector: 'app-order-editor-page',
  standalone: true,
  imports: [
    AsyncPipe,
    PoPageModule,
    PoLoadingModule,
    PoWidgetModule,
    PoButtonModule,
    PoTableModule,
    PoModalModule,
    OrderFormComponent,
    SupplyFormComponent,
    LookupModalComponent,
  ],
  templateUrl: './order-editor.page.html',
  styleUrl: './order-editor.page.scss',
})
export class OrderEditorPage implements OnInit, AfterViewInit {
  private readonly store = inject(ReduxStoreService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly notification = inject(PoNotificationService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild(OrderFormComponent) private readonly orderForm!: OrderFormComponent;
  @ViewChild(SupplyFormComponent) private readonly supplyForm!: SupplyFormComponent;
  @ViewChild(LookupModalComponent) private readonly lookupModal!: LookupModalComponent;
  @ViewChild('supplyModal', { static: true })
  private readonly supplyModal!: PoModalComponent;
  @ViewChild('deleteModal', { static: true })
  private readonly deleteModal!: PoModalComponent;

  readonly editor$ = this.store.select(selectEditor);
  readonly busy$ = this.store.select(selectEditorBusy);
  readonly saveRequest$ = this.store.select(selectSaveRequest);
  readonly supplyEditor$ = this.store.select(selectSupplyEditor);
  readonly saveSupplyRequest$ = this.store.select(selectSaveSupplyRequest);
  readonly lookupItems$ = this.store.select(selectLookupItems).pipe(map((items) => [...items]));
  readonly lookupPagination$ = this.store.select(selectLookupPagination);
  readonly lookupRequest$ = this.store.select(selectLookupRequestState);

  currentEditor: OrderEditorData | null = null;
  supplyItems: Array<SupplyListItem> = [];
  selectedSupply: SupplyListItem | null = null;
  private activeLookup: ActiveLookup | null = null;
  private supplyModalOpened = false;

  readonly pageActions: Array<PoPageAction> = [
    {
      label: 'Salvar',
      icon: 'an an-check',
      kind: 'primary',
      action: (): void => this.saveOrder(),
      disabled: (): boolean => this.store.snapshot(selectEditorBusy),
    },
    {
      label: 'Fechar',
      icon: 'an an-x',
      action: (): void => this.closePage(),
      disabled: (): boolean => this.store.snapshot(selectEditorBusy),
    },
  ];

  readonly supplyTableActions: Array<PoTableAction> = [
    {
      label: 'Editar',
      icon: 'an an-pencil-simple',
      action: (item: SupplyListItem): void => this.editSupply(item),
    },
    {
      label: 'Excluir',
      icon: 'an an-trash',
      type: 'danger',
      action: (item: SupplyListItem): void => this.askDeleteSupply(item),
    },
  ];

  readonly supplyColumns: Array<PoTableColumn> = [
    {
      property: 'type',
      label: 'Tipo',
      type: 'label',
      width: '150px',
      labels: [
        { value: 'F', color: 'caption-tag-07', label: 'Ferramenta' },
        { value: 'M', color: 'caption-tag-02', label: 'Mão de obra' },
        { value: 'P', color: 'caption-tag-13', label: 'Produto' },
        { value: 'T', color: 'caption-tag-08', label: 'Terceiro' },
        { value: 'E', color: 'caption-tag-10', label: 'Especialidade' },
      ],
    },
    { property: 'sequence', label: 'Seq.', type: 'number', width: '80px' },
    { property: 'taskDescription', label: 'Tarefa' },
    { property: 'supplyDescription', label: 'Insumo' },
    {
      property: 'quantity',
      label: 'Quantidade',
      type: 'number',
      format: '1.2-2',
      width: '130px',
    },
  ];

  get supplySaveAction(): PoModalAction {
    const request = this.store.snapshot(selectSaveSupplyRequest);
    return {
      label: 'Salvar',
      icon: 'an an-check',
      action: (): void => this.saveSupply(),
      disabled: request.status === 'loading',
      loading: request.status === 'loading',
    };
  }

  readonly supplyCloseAction: PoModalAction = {
    label: 'Fechar',
    action: (): void => this.closeSupplyModal(),
  };

  get deletePrimaryAction(): PoModalAction {
    const request = this.store.snapshot(selectDeleteSupplyRequest);
    return {
      label: 'Excluir',
      icon: 'an an-trash',
      danger: true,
      action: (): void => this.confirmDeleteSupply(),
      disabled: request.status === 'loading',
      loading: request.status === 'loading',
    };
  }

  readonly deleteSecondaryAction: PoModalAction = {
    label: 'Cancelar',
    action: (): void => this.deleteModal.close(),
  };

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const branch = params.get('branch') ?? undefined;
      const order = params.get('order') ?? undefined;
      this.store.dispatch(loadEditorRequested({ branch, order }));
    });

    this.editor$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((editor) => {
      this.currentEditor = editor;
      this.supplyItems = editor ? [...editor.value.supplies] : [];
    });

    this.store
      .select(selectLastSaveResult)
      .pipe(
        filter((result) => result !== null),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        const route = this.router.createUrlTree(['/ordens', result.branch, result.order]);
        this.location.replaceState(this.router.serializeUrl(route));
        this.store.dispatch(resetSaveResult());
      });
  }

  ngAfterViewInit(): void {
    this.supplyEditor$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((supplyEditor) => {
      if (supplyEditor && !this.supplyModalOpened) {
        this.supplyModalOpened = true;
        this.supplyModal.open();
      } else if (!supplyEditor && this.supplyModalOpened) {
        this.supplyModalOpened = false;
        this.supplyModal.close();
      }
    });
  }

  saveOrderRequest(request: SaveOrderRequest): void {
    this.store.dispatch(saveRequested(request));
  }

  saveSupplyRequest(request: SaveSupplyRequest): void {
    this.store.dispatch(saveSupplyRequested(request));
  }

  openOrderLookup(event: LookupOpenEvent): void {
    this.openLookup('order', event);
  }

  openSupplyLookup(event: LookupOpenEvent): void {
    this.openLookup('supply', event);
  }

  searchLookup(request: LookupRequest): void {
    this.store.dispatch(lookupRequested(request));
  }

  selectLookup(item: LookupItem): void {
    if (!this.activeLookup) {
      return;
    }

    if (this.activeLookup.scope === 'order') {
      this.orderForm.applyLookup(this.activeLookup.field as OrderLookupField, item);
    } else {
      this.supplyForm.applyLookup(this.activeLookup.field as SupplyLookupField, item);
    }
  }

  closeLookup(): void {
    this.activeLookup = null;
    this.store.dispatch(clearLookup());
  }

  addSupply(): void {
    const order = this.currentEditor?.value;
    if (!order || this.currentEditor?.mode !== 'update' || !order.branch || !order.order) {
      this.notification.warning('Salve a ordem de serviço antes de adicionar insumos.');
      return;
    }

    this.store.dispatch(
      loadSupplyEditorRequested({
        branch: order.branch,
        order: order.order,
        orderServiceId: order.orderServiceId,
      }),
    );
  }

  closeSupplyModal(): void {
    this.store.dispatch(closeSupplyEditor());
  }

  private saveOrder(): void {
    if (!this.orderForm.submit()) {
      this.notification.warning('Revise os campos inválidos antes de salvar.');
    }
  }

  private saveSupply(): void {
    if (!this.supplyForm.submit()) {
      this.notification.warning('Revise os campos inválidos do insumo antes de salvar.');
    }
  }

  private closePage(): void {
    void this.router.navigate(['/ordens']);
  }

  private editSupply(item: SupplyListItem): void {
    this.store.dispatch(
      loadSupplyEditorRequested({
        branch: item.branch || this.currentEditor?.value.branch || '',
        order: this.currentEditor?.value.order || '',
        orderServiceId: item.orderServiceId,
        sequence: item.sequence,
      }),
    );
  }

  private askDeleteSupply(item: SupplyListItem): void {
    this.selectedSupply = item;
    this.deleteModal.open();
  }

  private confirmDeleteSupply(): void {
    const order = this.currentEditor?.value;
    if (!this.selectedSupply || !order) {
      return;
    }

    const request: DeleteSupplyRequest = {
      orderServiceId: this.selectedSupply.orderServiceId,
      sequence: this.selectedSupply.sequence,
      branch: order.branch,
      order: order.order,
    };
    this.store.dispatch(deleteSupplyRequested(request));
    this.deleteModal.close();
    this.selectedSupply = null;
  }

  private openLookup(scope: ActiveLookup['scope'], event: LookupOpenEvent): void {
    this.activeLookup = { scope, field: event.field };
    this.lookupModal.open(event.title, event.type, event.filter);
  }
}
