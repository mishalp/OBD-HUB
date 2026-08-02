'use client';

import { FormEvent, useId, useRef, useState } from 'react';
import type { ItemFormValues } from '@/lib/types/item';
import { STOCK_UNITS } from '@/lib/types/item';
import { NumberInput, StringNumberInput } from '@/components/ui/NumberInput';

interface FieldErrors {
  name?: string;
  type?: string;
  unit?: string;
  price?: string;
  costPrice?: string;
  taxRate?: string;
}

interface ItemFormProps {
  initialValues: ItemFormValues;
  submitLabel: string;
  isSubmitting: boolean;
  serverError: string | null;
  fieldErrors?: FieldErrors;
  lockType?: boolean;
  onSubmit: (values: ItemFormValues) => Promise<void> | void;
  onCancel: () => void;
}

const inputClassName = 'ui-input h-11';

export const ItemForm = ({
  initialValues,
  submitLabel,
  isSubmitting,
  serverError,
  fieldErrors: externalErrors = {},
  lockType = false,
  onSubmit,
  onCancel,
}: ItemFormProps) => {
  const formId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<ItemFormValues>(initialValues);
  const [localErrors, setLocalErrors] = useState<FieldErrors>({});

  const fieldErrors: FieldErrors = {
    ...localErrors,
    ...externalErrors,
  };

  const setField = <K extends keyof ItemFormValues>(
    key: K,
    value: ItemFormValues[K],
  ): void => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (
      key === 'name' ||
      key === 'type' ||
      key === 'unit' ||
      key === 'price' ||
      key === 'costPrice' ||
      key === 'taxRate'
    ) {
      setLocalErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (values.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!values.type) {
      errors.type = 'Type is required';
    }

    if (!values.unit.trim()) {
      errors.unit = 'Unit is required';
    }

    if (Number.isNaN(values.price) || values.price < 0) {
      errors.price = 'Price must be greater than or equal to zero';
    }

    if (values.costPrice.trim() !== '') {
      const cost = Number(values.costPrice);
      if (Number.isNaN(cost) || cost < 0) {
        errors.costPrice = 'Cost price must be greater than or equal to zero';
      }
    }

    if (Number.isNaN(values.taxRate) || values.taxRate < 0 || values.taxRate > 100) {
      errors.taxRate = 'Tax rate must be between 0 and 100';
    }

    return errors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const errors = validate();
    setLocalErrors(errors);

    if (Object.keys(errors).length > 0) {
      if (errors.name) {
        nameRef.current?.focus();
      }
      return;
    }

    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor={`${formId}-name`} className="text-sm font-medium text-[#111827]">
            Item Name
          </label>
          <input
            ref={nameRef}
            id={`${formId}-name`}
            className={inputClassName}
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            disabled={isSubmitting}
          />
          {fieldErrors.name ? <p className="text-sm text-[#DC2626]">{fieldErrors.name}</p> : null}
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor={`${formId}-description`} className="text-sm font-medium text-[#111827]">
            Description
          </label>
          <textarea
            id={`${formId}-description`}
            rows={3}
            className="ui-textarea"
            value={values.description}
            onChange={(e) => setField('description', e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-type`} className="text-sm font-medium text-[#111827]">
            Type
          </label>
          <select
            id={`${formId}-type`}
            className={inputClassName}
            value={values.type}
            onChange={(e) => {
              const nextType = e.target.value as ItemFormValues['type'];
              setValues((prev) => ({
                ...prev,
                type: nextType,
                trackInventory: nextType === 'Product' ? prev.trackInventory || true : false,
                stockUnit:
                  nextType === 'Product'
                    ? prev.stockUnit || prev.unit || 'pcs'
                    : prev.stockUnit,
              }));
            }}
            disabled={isSubmitting || lockType}
          >
            <option value="Product">Product</option>
            <option value="Service">Service</option>
          </select>
          {fieldErrors.type ? <p className="text-sm text-[#DC2626]">{fieldErrors.type}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-category`} className="text-sm font-medium text-[#111827]">
            Category
          </label>
          <input
            id={`${formId}-category`}
            className={inputClassName}
            value={values.category}
            onChange={(e) => setField('category', e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-unit`} className="text-sm font-medium text-[#111827]">
            Unit
          </label>
          <input
            id={`${formId}-unit`}
            className={inputClassName}
            value={values.unit}
            onChange={(e) => {
              const unit = e.target.value;
              setValues((prev) => ({
                ...prev,
                unit,
                stockUnit:
                  prev.type === 'Product' && prev.trackInventory && !prev.stockUnit
                    ? unit
                    : prev.stockUnit,
              }));
            }}
            disabled={isSubmitting}
            placeholder="pcs, hrs, kg"
          />
          {fieldErrors.unit ? <p className="text-sm text-[#DC2626]">{fieldErrors.unit}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-status`} className="text-sm font-medium text-[#111827]">
            Status
          </label>
          <select
            id={`${formId}-status`}
            className={inputClassName}
            value={values.isActive ? 'active' : 'inactive'}
            onChange={(e) => setField('isActive', e.target.value === 'active')}
            disabled={isSubmitting}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {values.type === 'Product' ? (
          <div className="sm:col-span-2 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#111827]">Track Inventory</p>
                <p className="text-xs text-[#6B7280]">
                  Enable stock tracking for this product.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#111827]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[#E5E7EB] text-[#D32F2F] focus:ring-[#D32F2F]"
                  checked={values.trackInventory}
                  disabled={isSubmitting}
                  onChange={(e) => setField('trackInventory', e.target.checked)}
                />
                {values.trackInventory ? 'Enabled' : 'Disabled'}
              </label>
            </div>

            {values.trackInventory ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {!lockType ? (
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor={`${formId}-opening`}
                      className="text-sm font-medium text-[#111827]"
                    >
                      Opening Stock
                    </label>
                    <NumberInput
                      id={`${formId}-opening`}
                      min={0}
                      step="0.001"
                      className={inputClassName}
                      value={values.openingStock}
                      emptyValue={0}
                      disabled={isSubmitting}
                      onValueChange={(openingStock) => setField('openingStock', openingStock)}
                    />
                  </div>
                ) : null}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor={`${formId}-min-stock`}
                    className="text-sm font-medium text-[#111827]"
                  >
                    Minimum Stock
                  </label>
                  <NumberInput
                    id={`${formId}-min-stock`}
                    min={0}
                    step="0.001"
                    className={inputClassName}
                    value={values.minimumStock}
                    emptyValue={0}
                    disabled={isSubmitting}
                    onValueChange={(minimumStock) => setField('minimumStock', minimumStock)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor={`${formId}-max-stock`}
                    className="text-sm font-medium text-[#111827]"
                  >
                    Maximum Stock
                  </label>
                  <StringNumberInput
                    id={`${formId}-max-stock`}
                    min={0}
                    step="0.001"
                    className={inputClassName}
                    value={values.maximumStock}
                    disabled={isSubmitting}
                    placeholder="Optional"
                    onValueChange={(maximumStock) => setField('maximumStock', maximumStock)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor={`${formId}-stock-unit`}
                    className="text-sm font-medium text-[#111827]"
                  >
                    Stock Unit
                  </label>
                  <select
                    id={`${formId}-stock-unit`}
                    className={inputClassName}
                    value={values.stockUnit}
                    disabled={isSubmitting}
                    onChange={(e) => setField('stockUnit', e.target.value)}
                  >
                    {STOCK_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-price`} className="text-sm font-medium text-[#111827]">
            Price
          </label>
          <NumberInput
            id={`${formId}-price`}
            min={0}
            step="0.01"
            className={inputClassName}
            value={values.price}
            emptyValue={0}
            onValueChange={(price) => setField('price', price)}
            disabled={isSubmitting}
          />
          {fieldErrors.price ? <p className="text-sm text-[#DC2626]">{fieldErrors.price}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-cost`} className="text-sm font-medium text-[#111827]">
            Cost Price
          </label>
          <StringNumberInput
            id={`${formId}-cost`}
            min={0}
            step="0.01"
            className={inputClassName}
            value={values.costPrice}
            onValueChange={(costPrice) => setField('costPrice', costPrice)}
            disabled={isSubmitting}
          />
          {fieldErrors.costPrice ? (
            <p className="text-sm text-[#DC2626]">{fieldErrors.costPrice}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-tax`} className="text-sm font-medium text-[#111827]">
            Tax Rate (%)
          </label>
          <NumberInput
            id={`${formId}-tax`}
            min={0}
            max={100}
            step="0.01"
            className={inputClassName}
            value={values.taxRate}
            emptyValue={0}
            onValueChange={(taxRate) => setField('taxRate', taxRate)}
            disabled={isSubmitting}
          />
          {fieldErrors.taxRate ? (
            <p className="text-sm text-[#DC2626]">{fieldErrors.taxRate}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={`${formId}-sku`} className="text-sm font-medium text-[#111827]">
            SKU
          </label>
          <input
            id={`${formId}-sku`}
            className={inputClassName}
            value={values.sku}
            onChange={(e) => setField('sku', e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor={`${formId}-barcode`} className="text-sm font-medium text-[#111827]">
            Barcode
          </label>
          <input
            id={`${formId}-barcode`}
            className={inputClassName}
            value={values.barcode}
            onChange={(e) => setField('barcode', e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {serverError ? (
        <div className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#DC2626]">
          {serverError}
        </div>
      ) : null}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#FAFAFA] disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[#D32F2F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#B71C1C] disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
};
