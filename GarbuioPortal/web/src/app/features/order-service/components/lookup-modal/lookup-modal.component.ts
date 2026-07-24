import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  PoButtonModule,
  PoFieldModule,
  PoModalAction,
  PoModalComponent,
  PoModalModule,
  PoSelectOption,
  PoTableAction,
  PoTableColumn,
  PoTableModule,
} from '@po-ui/ng-components';

import { LookupItem, LookupRequest, LookupType, PageSize } from '../../models/order-service.models';

@Component({
  selector: 'app-lookup-modal',
  standalone: true,
  imports: [FormsModule, PoModalModule, PoFieldModule, PoButtonModule, PoTableModule],
  templateUrl: './lookup-modal.component.html',
  styleUrl: './lookup-modal.component.scss',
})
export class LookupModalComponent {
  @ViewChild('modal', { static: true }) private readonly modal!: PoModalComponent;

  @Input() loading = false;
  @Input() page = 1;
  @Input() pageSize: PageSize = 10;
  @Input() hasNext = false;
  @Output() readonly search = new EventEmitter<LookupRequest>();
  @Output() readonly selected = new EventEmitter<LookupItem>();
  @Output() readonly closed = new EventEmitter<void>();

  title = 'Pesquisa';
  query = '';
  items: Array<LookupItem> = [];
  private request: LookupRequest | null = null;
  readonly pageSizeOptions: Array<PoSelectOption> = [
    { label: '10 registros', value: 10 },
    { label: '50 registros', value: 50 },
    { label: '100 registros', value: 100 },
  ];

  readonly columns: Array<PoTableColumn> = [
    { property: 'code', label: 'Código', width: '25%' },
    { property: 'description', label: 'Descrição' },
  ];

  readonly tableActions: Array<PoTableAction> = [
    {
      label: 'Selecionar',
      icon: 'an an-check',
      action: (item: LookupItem): void => this.select(item),
    },
  ];

  readonly closeAction: PoModalAction = {
    label: 'Fechar',
    action: (): void => this.close(),
  };

  @Input()
  set results(value: ReadonlyArray<LookupItem>) {
    this.items = [...value];
  }

  open(title: string, type: LookupType, filter: string): void {
    this.title = title;
    this.query = '';
    this.request = { type, filter, query: '', page: 1, pageSize: 10 };
    this.items = [];
    this.modal.open();
    this.runSearch();
  }

  close(): void {
    this.modal.close();
  }

  runSearch(): void {
    if (!this.request || this.loading) {
      return;
    }

    this.emitPage(1, this.request.pageSize);
  }

  previousPage(): void {
    this.emitPage(Math.max(1, this.page - 1), this.pageSize);
  }

  nextPage(): void {
    if (this.hasNext) {
      this.emitPage(this.page + 1, this.pageSize);
    }
  }

  changePageSize(value: string | number): void {
    this.emitPage(1, this.toPageSize(value));
  }

  private select(item: LookupItem): void {
    this.selected.emit(item);
    this.close();
  }

  private emitPage(page: number, pageSize: PageSize): void {
    if (!this.request || this.loading) {
      return;
    }

    this.request = {
      ...this.request,
      query: this.query.trim(),
      page,
      pageSize,
    };
    this.search.emit(this.request);
  }

  private toPageSize(value: string | number): PageSize {
    const parsed = Number(value);
    return parsed === 50 || parsed === 100 ? parsed : 10;
  }
}
