import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PoButtonModule, PoFieldModule, PoSelectOption } from '@po-ui/ng-components';

import {
  LookupItem,
  LookupType,
  OrderEditorData,
  OrderStatus,
  OrderType,
  SaveOrderRequest,
  ThirdPartyFlag,
} from '../../models/order-service.models';

export type OrderLookupField = 'asset' | 'service' | 'costCenter';

export interface LookupOpenEvent {
  readonly field: OrderLookupField | SupplyLookupField;
  readonly type: LookupType;
  readonly filter: string;
  readonly title: string;
}

export type SupplyLookupField = 'task' | 'supply' | 'warehouse' | 'location' | 'supplier';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [ReactiveFormsModule, PoFieldModule, PoButtonModule],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.scss',
})
export class OrderFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private mode: 'create' | 'update' = 'create';
  isEditing = false;

  @Input() loading = false;
  @Output() readonly save = new EventEmitter<SaveOrderRequest>();
  @Output() readonly openLookup = new EventEmitter<LookupOpenEvent>();

  branchOptions: Array<PoSelectOption> = [];
  originBranchOptions: Array<PoSelectOption> = [];
  statusOptions: Array<PoSelectOption> = [];
  typeOptions: Array<PoSelectOption> = [];
  thirdPartyOptions: Array<PoSelectOption> = [];

  readonly form = this.formBuilder.nonNullable.group({
    orderServiceId: 0,
    order: [{ value: '', disabled: true }],
    status: [{ value: '', disabled: true }],
    type: ['', Validators.required],
    branch: ['', Validators.required],
    originalDate: ['', Validators.required],
    originBranch: '',
    startDate: ['', Validators.required],
    startTime: ['', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):[0-5]\d$/)]],
    thirdParty: '',
    assetCode: '',
    assetDescription: '',
    serviceCode: '',
    serviceDescription: '',
    costCenterCode: '',
    costCenterDescription: '',
    inclusionUser: [{ value: '', disabled: true }],
    changeUser: [{ value: '', disabled: true }],
    notes: '',
  });

  @Input()
  set data(data: OrderEditorData | null) {
    if (!data) {
      return;
    }

    this.mode = data.mode;
    this.isEditing = data.mode === 'update';
    this.branchOptions = [...data.referenceData.branches];
    this.originBranchOptions = [...data.referenceData.originBranches];
    this.statusOptions = [...data.referenceData.statuses];
    this.typeOptions = [...data.referenceData.types];
    this.thirdPartyOptions = [...data.referenceData.thirdPartyOptions];
    this.form.reset({
      orderServiceId: data.value.orderServiceId,
      order: data.value.order,
      status: data.value.status,
      type: data.value.type,
      branch: data.value.branch,
      originalDate: data.value.originalDate,
      originBranch: data.value.originBranch,
      startDate: data.value.startDate,
      startTime: data.value.startTime,
      thirdParty: data.value.thirdParty,
      assetCode: data.value.asset.code,
      assetDescription: data.value.asset.description,
      serviceCode: data.value.service.code,
      serviceDescription: data.value.service.description,
      costCenterCode: data.value.costCenter.code,
      costCenterDescription: data.value.costCenter.description,
      inclusionUser: data.value.inclusionUser,
      changeUser: data.value.changeUser,
      notes: data.value.notes,
    });
    this.configureControlState();
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
        order: value.order.trim(),
        status: this.toStatus(value.status),
        type: this.toType(value.type),
        branch: value.branch,
        originalDate: value.originalDate,
        originBranch: value.originBranch,
        startDate: value.startDate,
        startTime: value.startTime,
        thirdParty: this.toThirdParty(value.thirdParty),
        asset: { code: value.assetCode, description: value.assetDescription },
        service: { code: value.serviceCode, description: value.serviceDescription },
        costCenter: {
          code: value.costCenterCode,
          description: value.costCenterDescription,
        },
        inclusionUser: value.inclusionUser,
        changeUser: value.changeUser,
        notes: value.notes,
      },
    });
    return true;
  }

  requestLookup(field: OrderLookupField): void {
    const configuration: Record<OrderLookupField, Pick<LookupOpenEvent, 'type' | 'title'>> = {
      asset: { type: 'TJ_CODBEM', title: 'Pesquisa de bem' },
      service: { type: 'TJ_SERVICO', title: 'Pesquisa de serviço' },
      costCenter: { type: 'TJ_CODAREA', title: 'Pesquisa de centro de custo' },
    };

    this.openLookup.emit({
      field,
      filter: '',
      ...configuration[field],
    });
  }

  applyLookup(field: OrderLookupField, item: LookupItem): void {
    const controlNames: Record<OrderLookupField, readonly [string, string]> = {
      asset: ['assetCode', 'assetDescription'],
      service: ['serviceCode', 'serviceDescription'],
      costCenter: ['costCenterCode', 'costCenterDescription'],
    };
    const [codeControl, descriptionControl] = controlNames[field];
    this.form.get(codeControl)?.setValue(item.code);
    this.form.get(descriptionControl)?.setValue(item.description);
  }

  private toStatus(value: string): OrderStatus {
    return value === 'P' || value === 'C' || value === 'L' ? value : '';
  }

  private toType(value: string): OrderType {
    return value === 'B' ? value : '';
  }

  private toThirdParty(value: string): ThirdPartyFlag {
    return value === '1' || value === '2' ? value : '';
  }

  private configureControlState(): void {
    this.form.enable({ emitEvent: false });

    if (this.isEditing) {
      this.form.disable({ emitEvent: false });
      this.form.controls.notes.enable({ emitEvent: false });
      return;
    }

    this.form.controls.order.disable({ emitEvent: false });
    this.form.controls.status.disable({ emitEvent: false });
    this.form.controls.inclusionUser.disable({ emitEvent: false });
    this.form.controls.changeUser.disable({ emitEvent: false });
  }
}
