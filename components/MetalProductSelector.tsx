'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CUSTOM_OPTION,
  TALMECH_HELP_OPTION,
  finalDropdownLabel,
  getGradeOptions,
  getProductFormOptions,
  getProductOptions,
  metalMaterialCategories,
} from '@/data/whatsappUploadOptions';

export type MetalProductSelectorValue = {
  metal?: string;
  product?: string;
  grade?: string;
  productForm?: string;
  selectedMetal?: string;
  selectedProduct?: string;
  selectedGrade?: string;
  selectedProductForm?: string;
  customMetal?: string;
  customProduct?: string;
  customGrade?: string;
  customProductForm?: string;
};

type SelectorState = Required<Pick<
  MetalProductSelectorValue,
  | 'selectedMetal'
  | 'selectedProduct'
  | 'selectedGrade'
  | 'selectedProductForm'
  | 'customMetal'
  | 'customProduct'
  | 'customGrade'
  | 'customProductForm'
>>;

type Props = {
  value: MetalProductSelectorValue;
  onChange: (next: MetalProductSelectorValue) => void;
  requiredLevel?: 'none' | 'metal-product' | 'all';
  mode?: 'admin' | 'client' | 'whatsapp';
  showGrade?: boolean;
  showProductForm?: boolean;
  compact?: boolean;
};

function uniqueOptions(items: string[]) {
  return items.filter((item, index) => item && items.indexOf(item) === index);
}

function withHelpAndCustom(items: string[]) {
  const withoutCustom = items.filter((item) => item !== CUSTOM_OPTION);
  return uniqueOptions([...withoutCustom, TALMECH_HELP_OPTION, CUSTOM_OPTION]);
}

function optionState(value: unknown, selected: unknown, custom: unknown, options: string[]) {
  const selectedText = String(selected || '').trim();
  const customText = String(custom || '').trim();
  const normalized = String(value || '').trim();

  if (selectedText === CUSTOM_OPTION || customText) {
    return { selected: CUSTOM_OPTION, custom: customText || (normalized === CUSTOM_OPTION ? '' : normalized) };
  }
  if (selectedText && options.includes(selectedText)) return { selected: selectedText, custom: '' };
  if (!normalized) return { selected: '', custom: '' };
  if (options.includes(normalized)) return { selected: normalized, custom: '' };
  return { selected: CUSTOM_OPTION, custom: normalized };
}

function stateFromValue(value: MetalProductSelectorValue): SelectorState {
  const metalOptions = withHelpAndCustom(metalMaterialCategories);
  const metal = optionState(value.metal, value.selectedMetal, value.customMetal, metalOptions);
  const productOptions = withHelpAndCustom(getProductOptions(metal.selected));
  const gradeOptions = withHelpAndCustom(getGradeOptions(metal.selected));
  const productFormOptions = withHelpAndCustom(getProductFormOptions(metal.selected));
  const product = optionState(value.product, value.selectedProduct, value.customProduct, productOptions);
  const grade = optionState(value.grade, value.selectedGrade, value.customGrade, gradeOptions);
  const productForm = optionState(value.productForm, value.selectedProductForm, value.customProductForm, productFormOptions);

  return {
    selectedMetal: metal.selected,
    customMetal: metal.custom,
    selectedProduct: product.selected,
    customProduct: product.custom,
    selectedGrade: grade.selected,
    customGrade: grade.custom,
    selectedProductForm: productForm.selected,
    customProductForm: productForm.custom,
  };
}

function normalize(state: SelectorState, showGrade: boolean, showProductForm: boolean): MetalProductSelectorValue {
  return {
    selectedMetal: state.selectedMetal,
    customMetal: state.customMetal,
    metal: finalDropdownLabel(state.selectedMetal, state.customMetal),
    selectedProduct: state.selectedProduct,
    customProduct: state.customProduct,
    product: finalDropdownLabel(state.selectedProduct, state.customProduct),
    selectedGrade: state.selectedGrade,
    customGrade: state.customGrade,
    grade: showGrade ? finalDropdownLabel(state.selectedGrade, state.customGrade) : '',
    selectedProductForm: state.selectedProductForm,
    customProductForm: state.customProductForm,
    productForm: showProductForm ? finalDropdownLabel(state.selectedProductForm, state.customProductForm) : '',
  };
}

function labelBadge(label: string, required: boolean) {
  return (
    <span className="fieldLabel">
      {label}
      <span className={required ? 'fieldBadge required' : 'fieldBadge optional'}>
        {required ? 'Required' : 'Optional'}
      </span>
    </span>
  );
}

export default function MetalProductSelector({
  value,
  onChange,
  requiredLevel = 'metal-product',
  mode = 'client',
  showGrade = true,
  showProductForm = true,
  compact = false,
}: Props) {
  const [state, setState] = useState<SelectorState>(() => stateFromValue(value || {}));
  const syncKey = [value?.metal, value?.product, value?.grade, value?.productForm].join('|');

  useEffect(() => {
    setState(stateFromValue(value || {}));
  }, [syncKey]);

  const metalOptions = useMemo(() => withHelpAndCustom(metalMaterialCategories), []);
  const productOptions = useMemo(() => withHelpAndCustom(getProductOptions(state.selectedMetal)), [state.selectedMetal]);
  const gradeOptions = useMemo(() => withHelpAndCustom(getGradeOptions(state.selectedMetal)), [state.selectedMetal]);
  const productFormOptions = useMemo(() => withHelpAndCustom(getProductFormOptions(state.selectedMetal)), [state.selectedMetal]);

  function update(patch: Partial<SelectorState>) {
    const next = { ...state, ...patch };
    setState(next);
    onChange(normalize(next, showGrade, showProductForm));
  }

  function changeMetal(selectedMetal: string) {
    update({
      selectedMetal,
      customMetal: selectedMetal === CUSTOM_OPTION ? state.customMetal : '',
      selectedProduct: '',
      customProduct: '',
      selectedGrade: '',
      customGrade: '',
      selectedProductForm: '',
      customProductForm: '',
    });
  }

  const productRequired = requiredLevel === 'all' || requiredLevel === 'metal-product';
  const gradeRequired = requiredLevel === 'all';
  const gridClass = compact ? 'metalProductSelector compact' : 'metalProductSelector';

  return (
    <div className={`${gridClass} ${mode}`}>
      <label className="selectorField">
        {labelBadge('Metal', productRequired)}
        <select value={state.selectedMetal} onChange={(event) => changeMetal(event.target.value)}>
          <option value="">Select metal</option>
          {metalOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
      {state.selectedMetal === CUSTOM_OPTION && (
        <label className="selectorField">
          {labelBadge('Custom metal', productRequired)}
          <input className="input" value={state.customMetal} onChange={(event) => update({ customMetal: event.target.value })} placeholder="Example: Inconel, industrial item" />
        </label>
      )}

      <label className="selectorField">
        {labelBadge('Product', productRequired)}
        <select value={state.selectedProduct} onChange={(event) => update({ selectedProduct: event.target.value, customProduct: event.target.value === CUSTOM_OPTION ? state.customProduct : '' })}>
          <option value="">Select product</option>
          {productOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
      {state.selectedProduct === CUSTOM_OPTION && (
        <label className="selectorField">
          {labelBadge('Custom product', productRequired)}
          <input className="input" value={state.customProduct} onChange={(event) => update({ customProduct: event.target.value })} placeholder="Example: punched copper strip" />
        </label>
      )}

      {showGrade && (
        <>
          <label className="selectorField">
            {labelBadge('Grade', gradeRequired)}
            <select value={state.selectedGrade} onChange={(event) => update({ selectedGrade: event.target.value, customGrade: event.target.value === CUSTOM_OPTION ? state.customGrade : '' })}>
              <option value="">Select grade</option>
              {gradeOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          {state.selectedGrade === CUSTOM_OPTION && (
            <label className="selectorField">
              {labelBadge('Custom grade', gradeRequired)}
              <input className="input" value={state.customGrade} onChange={(event) => update({ customGrade: event.target.value })} placeholder="Example: EN24T, 99.9%" />
            </label>
          )}
        </>
      )}

      {showProductForm && (
        <>
          <label className="selectorField">
            {labelBadge('Product form', false)}
            <select value={state.selectedProductForm} onChange={(event) => update({ selectedProductForm: event.target.value, customProductForm: event.target.value === CUSTOM_OPTION ? state.customProductForm : '' })}>
              <option value="">Select product form</option>
              {productFormOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          {state.selectedProductForm === CUSTOM_OPTION && (
            <label className="selectorField">
              {labelBadge('Custom product form', false)}
              <input className="input" value={state.customProductForm} onChange={(event) => update({ customProductForm: event.target.value })} placeholder="Example: laser cut blank" />
            </label>
          )}
        </>
      )}
    </div>
  );
}
