import { TestBed } from '@angular/core/testing';

import { SaveSupplyRequest, SupplyEditorData } from '../../models/order-service.models';
import { SupplyFormComponent } from './supply-form.component';

function editorData(mode: 'create' | 'update', sequence = 0): SupplyEditorData {
  return {
    mode,
    value: {
      orderServiceId: 0,
      sequence,
      branch: '0101',
      order: '171816',
      task: {
        code: '000037',
        description: 'TROCA LAMPADA LANTERNA TRASEIRA',
      },
      type: 'E',
      supply: { code: '001', description: 'MECANICO CAVALO' },
      resourceQuantity: 1,
      quantity: 0.2,
      startDate: '2026-07-06',
      startTime: '04:21',
      warehouse: { code: '01', description: 'LIMEIRA' },
      location: {
        code: 'PRATELEIRA11-E',
        description: 'ENDERECO PRATELEIRA11-E',
      },
      supplier: {
        code: '000019',
        description: 'APOLO COMERCIO DE PECAS AUTO LTDA EPP',
      },
      purchaseRequest: '',
      invoice: '',
      invoiceSeries: '',
      notes: '',
    },
    types: [{ label: 'Especialidade', value: 'E' }],
  };
}

describe('SupplyFormComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplyFormComponent],
    }).compileComponents();
  });

  it('keeps sequence zero in update mode and fills returned descriptions', () => {
    const fixture = TestBed.createComponent(SupplyFormComponent);
    const component = fixture.componentInstance;
    let submitted: SaveSupplyRequest | undefined;
    component.save.subscribe((request) => {
      submitted = request;
    });

    component.data = editorData('update');

    expect(component.form.controls.sequence.value).toBe('0');
    expect(component.form.controls.taskDescription.value).toBe('TROCA LAMPADA LANTERNA TRASEIRA');
    expect(component.form.controls.supplyDescription.value).toBe('MECANICO CAVALO');
    expect(component.form.controls.warehouseDescription.value).toBe('LIMEIRA');
    expect(component.form.controls.locationDescription.value).toBe('ENDERECO PRATELEIRA11-E');
    expect(component.form.controls.supplierDescription.value).toBe(
      'APOLO COMERCIO DE PECAS AUTO LTDA EPP',
    );
    expect(component.submit()).toBe(true);
    expect(submitted?.mode).toBe('update');
    expect(submitted?.value.sequence).toBe(0);
  });

  it('shows and submits sequence one for the first new supply', () => {
    const fixture = TestBed.createComponent(SupplyFormComponent);
    const component = fixture.componentInstance;
    let submitted: SaveSupplyRequest | undefined;
    component.save.subscribe((request) => {
      submitted = request;
    });

    component.data = editorData('create', 1);

    expect(component.form.controls.sequence.value).toBe('1');
    expect(component.submit()).toBe(true);
    expect(submitted?.mode).toBe('create');
    expect(submitted?.value.sequence).toBe(1);
  });
});
