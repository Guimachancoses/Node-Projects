import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PoButtonModule,
  PoFieldModule,
  PoSelectOption,
  PoWidgetModule,
} from '@po-ui/ng-components';

import {
  LookupItem,
  OrderFilter,
  OrderSearchReferenceData,
  OrderStatus,
} from '../../models/order-service.models';

export interface OrderFilterLookupRequest {
  readonly field: 'order' | 'plate';
  readonly title: string;
  readonly type: 'TJ_ORDEM' | 'TJ_CODBEM';
  readonly filter: string;
}

@Component({
  selector: 'app-order-filter',
  standalone: true,
  imports: [ReactiveFormsModule, PoWidgetModule, PoFieldModule, PoButtonModule],
  templateUrl: './order-filter.component.html',
  styleUrl: './order-filter.component.scss',
})
export class OrderFilterComponent {
  private readonly formBuilder = inject(FormBuilder);
  private initialized = false;
  private initialFilter: OrderFilter | null = null;

  @Input() loading = false;
  @Output() readonly search = new EventEmitter<OrderFilter>();
  @Output() readonly openLookup = new EventEmitter<OrderFilterLookupRequest>();

  readonly form = this.formBuilder.nonNullable.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    branch: ['', Validators.required],
    status: '',
    order: '',
    plate: '',
  });

  branchOptions: Array<PoSelectOption> = [];
  statusOptions: Array<PoSelectOption> = [];

  @Input()
  set referenceData(value: OrderSearchReferenceData | null) {
    if (!value) {
      return;
    }

    this.branchOptions = [...value.branches];
    this.statusOptions = [...value.statuses];
    this.initialFilter = value.initialFilter;

    if (!this.initialized) {
      this.form.patchValue(value.initialFilter);
      this.initialized = true;
    }
  }

  submit(): void {
    if (this.loading || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.search.emit({
      ...value,
      status: this.toOrderStatus(value.status),
    });
  }

  openOrderLookup(): void {
    const { branch, startDate, endDate } = this.form.getRawValue();
    if (!branch || !startDate || !endDate) {
      this.form.controls.branch.markAsTouched();
      this.form.controls.startDate.markAsTouched();
      this.form.controls.endDate.markAsTouched();
      return;
    }
    this.openLookup.emit({
      field: 'order',
      title: 'Pesquisa de ordem',
      type: 'TJ_ORDEM',
      filter: `${branch};${startDate};${endDate}`,
    });
  }

  openPlateLookup(): void {
    this.openLookup.emit({
      field: 'plate',
      title: 'Pesquisa de bem',
      type: 'TJ_CODBEM',
      filter: '',
    });
  }

  applyLookup(field: OrderFilterLookupRequest['field'], item: LookupItem): void {
    this.form.controls[field].setValue(item.code);
  }

  clear(): void {
    if (!this.initialFilter || this.loading) {
      return;
    }
    this.form.reset({
      ...this.initialFilter,
      status: '',
      order: '',
      plate: '',
    });
    this.submit();
  }

  private toOrderStatus(value: string): OrderStatus {
    return value === 'P' || value === 'C' || value === 'L' ? value : '';
  }
}
