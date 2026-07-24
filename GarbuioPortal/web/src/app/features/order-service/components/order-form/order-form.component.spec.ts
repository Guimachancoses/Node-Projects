import { TestBed } from '@angular/core/testing';

import { OrderEditorData } from '../../models/order-service.models';
import { OrderFormComponent } from './order-form.component';

function editorData(mode: 'create' | 'update'): OrderEditorData {
  return {
    mode,
    value: {
      orderServiceId: 0,
      order: mode === 'update' ? '171816' : '',
      status: 'P',
      type: 'B',
      branch: mode === 'update' ? '0101' : '',
      originalDate: '2026-07-06',
      originBranch: mode === 'update' ? 'LPA' : '',
      startDate: '2026-07-06',
      startTime: '03:40',
      thirdParty: '1',
      asset: { code: 'SYD4C58', description: 'SYD4C58 - VOLVO FH 540 6X4' },
      service: { code: 'MNT020', description: 'MECANICA CAVALO' },
      costCenter: { code: '1016', description: 'OP PROPRIA MADEIRA SP/MS' },
      inclusionUser: 'armando.morelli',
      changeUser: 'armando.morelli',
      notes: 'TROCA LAMPADA LANTERNA TRASEIRA',
      supplies: [],
    },
    referenceData: {
      branches: [{ label: 'Matriz', value: '0101' }],
      originBranches: [{ label: 'Lençóis Paulista', value: 'LPA' }],
      statuses: [{ label: 'Pendente', value: 'P' }],
      types: [{ label: 'Bem', value: 'B' }],
      thirdPartyOptions: [{ label: 'Não', value: '1' }],
    },
  };
}

describe('OrderFormComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderFormComponent],
    }).compileComponents();
  });

  it('keeps only observation enabled when editing an order with integration id zero', () => {
    const fixture = TestBed.createComponent(OrderFormComponent);
    const component = fixture.componentInstance;

    component.data = editorData('update');

    for (const [name, control] of Object.entries(component.form.controls)) {
      expect(control.disabled, name).toBe(name !== 'notes');
    }
    expect(component.form.controls.notes.enabled).toBe(true);
    expect(component.isEditing).toBe(true);
  });

  it('enables the editable fields when creating an order', () => {
    const fixture = TestBed.createComponent(OrderFormComponent);
    const component = fixture.componentInstance;

    component.data = editorData('update');
    component.data = editorData('create');

    expect(component.form.controls.type.enabled).toBe(true);
    expect(component.form.controls.branch.enabled).toBe(true);
    expect(component.form.controls.assetDescription.enabled).toBe(true);
    expect(component.form.controls.notes.enabled).toBe(true);
    expect(component.form.controls.order.disabled).toBe(true);
    expect(component.form.controls.status.disabled).toBe(true);
    expect(component.isEditing).toBe(false);
  });

  it('shows the authenticated user returned for a new order', () => {
    const fixture = TestBed.createComponent(OrderFormComponent);
    const component = fixture.componentInstance;
    const data = editorData('create');

    component.data = {
      ...data,
      value: {
        ...data.value,
        inclusionUser: 'guilherme.machado',
        changeUser: '',
      },
    };

    expect(component.form.controls.inclusionUser.value).toBe('guilherme.machado');
    expect(component.form.controls.inclusionUser.disabled).toBe(true);
    expect(component.form.controls.changeUser.value).toBe('');
  });
});
