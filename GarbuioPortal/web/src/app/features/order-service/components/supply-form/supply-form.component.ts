import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PoButtonModule, PoFieldModule, PoSelectOption } from '@po-ui/ng-components';

import {
  LookupItem,
  SaveSupplyRequest,
  SupplyEditorData,
  SupplyType,
} from '../../models/order-service.models';
import { LookupOpenEvent, SupplyLookupField } from '../order-form/order-form.component';

@Component({
  selector: 'app-supply-form',
  standalone: true,
  imports: [ReactiveFormsModule, PoFieldModule, PoButtonModule],
  templateUrl: './supply-form.component.html',
  styleUrl: './supply-form.component.scss',
})
export class SupplyFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private mode: 'create' | 'update' = 'create';

  @Input() loading = false;
  @Output() readonly save = new EventEmitter<SaveSupplyRequest>();
  @Output() readonly openLookup = new EventEmitter<LookupOpenEvent>();

  typeOptions: Array<PoSelectOption> = [];

  readonly form = this.formBuilder.nonNullable.group({
    orderServiceId: 0,
    sequence: [{ value: '0', disabled: true }],
    branch: '',
    order: '',
    taskCode: '',
    taskDescription: '',
    type: ['', Validators.required],
    supplyCode: '',
    supplyDescription: '',
    resourceQuantity: [0, [Validators.required, Validators.min(0)]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    startDate: '',
    startTime: ['', Validators.pattern(/^$|^([01]\d|2[0-3]):[0-5]\d$/)],
    warehouseCode: '',
    warehouseDescription: '',
    locationCode: '',
    locationDescription: '',
    supplierCode: '',
    supplierDescription: '',
    purchaseRequest: [{ value: '', disabled: true }],
    invoice: '',
    invoiceSeries: '',
    notes: '',
  });

  @Input()
  set data(data: SupplyEditorData | null) {
    if (!data) {
      return;
    }

    this.mode = data.mode;
    this.typeOptions = [...data.types];
    this.form.reset({
      orderServiceId: data.value.orderServiceId,
      sequence: String(data.value.sequence),
      branch: data.value.branch,
      order: data.value.order,
      taskCode: data.value.task.code,
      taskDescription: data.value.task.description,
      type: data.value.type,
      supplyCode: data.value.supply.code,
      supplyDescription: data.value.supply.description,
      resourceQuantity: data.value.resourceQuantity,
      quantity: data.value.quantity,
      startDate: data.value.startDate,
      startTime: data.value.startTime,
      warehouseCode: data.value.warehouse.code,
      warehouseDescription: data.value.warehouse.description,
      locationCode: data.value.location.code,
      locationDescription: data.value.location.description,
      supplierCode: data.value.supplier.code,
      supplierDescription: data.value.supplier.description,
      purchaseRequest: data.value.purchaseRequest,
      invoice: data.value.invoice,
      invoiceSeries: data.value.invoiceSeries,
      notes: data.value.notes,
    });
  }

  submit(): boolean {
    if (this.loading || this.form.invalid) {
      this.form.markAllAsTouched();
      return false;
    }

    const value = this.form.getRawValue();
    this.save.emit({
      mode: this.mode,
      value: {
        orderServiceId: value.orderServiceId,
        sequence: Number(value.sequence),
        branch: value.branch,
        order: value.order,
        task: { code: value.taskCode, description: value.taskDescription },
        type: this.toSupplyType(value.type),
        supply: { code: value.supplyCode, description: value.supplyDescription },
        resourceQuantity: value.resourceQuantity,
        quantity: value.quantity,
        startDate: value.startDate,
        startTime: value.startTime,
        warehouse: {
          code: value.warehouseCode,
          description: value.warehouseDescription,
        },
        location: { code: value.locationCode, description: value.locationDescription },
        supplier: { code: value.supplierCode, description: value.supplierDescription },
        purchaseRequest: value.purchaseRequest,
        invoice: value.invoice,
        invoiceSeries: value.invoiceSeries,
        notes: value.notes,
      },
    });
    return true;
  }

  requestLookup(field: SupplyLookupField): void {
    const value = this.form.getRawValue();
    const events: Record<SupplyLookupField, Omit<LookupOpenEvent, 'field'>> = {
      task: {
        type: 'TL_TAREFA',
        filter: value.branch,
        title: 'Pesquisa de tarefa',
      },
      supply: {
        type: 'TL_CODIGO',
        filter: `${value.branch};${value.type}`,
        title: 'Pesquisa de insumo',
      },
      warehouse: {
        type: 'TL_LOCAL',
        filter: value.branch,
        title: 'Pesquisa de almoxarifado',
      },
      location: {
        type: 'TL_LOCALIZ',
        filter: `${value.branch};${value.warehouseCode}`,
        title: 'Pesquisa de localização',
      },
      supplier: {
        type: 'TL_FORNEC',
        filter: value.branch,
        title: 'Pesquisa de fornecedor',
      },
    };

    this.openLookup.emit({ field, ...events[field] });
  }

  applyLookup(field: SupplyLookupField, item: LookupItem): void {
    const controlNames: Record<SupplyLookupField, readonly [string, string]> = {
      task: ['taskCode', 'taskDescription'],
      supply: ['supplyCode', 'supplyDescription'],
      warehouse: ['warehouseCode', 'warehouseDescription'],
      location: ['locationCode', 'locationDescription'],
      supplier: ['supplierCode', 'supplierDescription'],
    };
    const [codeControl, descriptionControl] = controlNames[field];
    this.form.get(codeControl)?.setValue(item.code);
    this.form.get(descriptionControl)?.setValue(item.description);
  }

  private toSupplyType(value: string): SupplyType {
    return value === 'F' || value === 'M' || value === 'P' || value === 'T' || value === 'E'
      ? value
      : '';
  }
}
