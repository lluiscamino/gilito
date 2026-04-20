import { FormTitleRow } from './form_title_row.ts';

export class InputFormLayout {
  private readonly title: string;
  private readonly onCancel: () => void;
  private readonly contents: HTMLElement;
  private readonly confirmText: string;
  private readonly onConfirm: () => void;

  constructor(options: {
    title: string;
    onCancel: () => void;
    contents: HTMLElement;
    confirmText: string;
    onConfirm: () => void;
  }) {
    this.title = options.title;
    this.onCancel = options.onCancel;
    this.contents = options.contents;
    this.confirmText = options.confirmText;
    this.onConfirm = options.onConfirm;
  }

  render(): HTMLElement {
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn-confirm';
    confirmBtn.type = 'button';
    confirmBtn.textContent = this.confirmText;
    confirmBtn.addEventListener('click', this.onConfirm);

    const main = document.createElement('main');
    main.className = 'snapshot-layout';
    main.append(new FormTitleRow(this.title, this.onCancel).render(), this.contents, confirmBtn);
    return main;
  }
}
