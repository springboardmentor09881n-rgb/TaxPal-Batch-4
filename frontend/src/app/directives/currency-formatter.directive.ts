import { Directive, ElementRef, HostListener, Renderer2, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: '[appCurrencyFormatter]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencyFormatterDirective),
      multi: true
    }
  ]
})
export class CurrencyFormatterDirective implements ControlValueAccessor {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(value: number | null): void {
    const input = this.el.nativeElement as HTMLInputElement;
    if (value === null || value === undefined) {
      this.renderer.setProperty(input, 'value', '');
      return;
    }
    // Visually format the number (e.g. 1000.5 -> 1,000.5)
    const formatted = this.formatValue(String(value));
    this.renderer.setProperty(input, 'value', formatted);
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    // Save current cursor position
    const start = input.selectionStart ?? 0;
    const commasBefore = (value.slice(0, start).match(/,/g) || []).length;

    // Format input value
    const formatted = this.formatValue(value);
    this.renderer.setProperty(input, 'value', formatted);

    // Restore cursor position correctly
    const commasAfter = (formatted.slice(0, start).match(/,/g) || []).length;
    const pos = start + (commasAfter - commasBefore);
    input.setSelectionRange(pos, pos);

    // Parse value to float to update the model
    const cleanNum = parseFloat(formatted.replace(/,/g, ''));
    this.onChange(isNaN(cleanNum) ? null : cleanNum);
  }

  @HostListener('blur')
  onBlur(): void {
    const input = this.el.nativeElement as HTMLInputElement;
    const val = input.value.replace(/,/g, '');
    const num = parseFloat(val);
    if (!isNaN(num)) {
      // Force format with exactly 2 decimal places on blur for consistency
      this.renderer.setProperty(input, 'value', num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
    this.onTouched();
  }

  private formatValue(value: string): string {
    if (!value) return '';

    // Strip out all characters except numbers and one decimal dot
    let clean = value.replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    if (parts.length > 2) {
      clean = parts[0] + '.' + parts.slice(1).join('');
    }

    const cleanParts = clean.split('.');
    let formatted = '';
    if (cleanParts[0]) {
      formatted = Number(cleanParts[0]).toLocaleString('en-US');
    }
    if (cleanParts[1] !== undefined) {
      formatted += '.' + cleanParts[1].substring(0, 2);
    } else if (clean.endsWith('.')) {
      formatted += '.';
    }

    return formatted;
  }
}
