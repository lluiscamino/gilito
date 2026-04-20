export class FormTitleRow {
  private readonly title: string;
  private readonly onCancel: () => void;

  constructor(title: string, onCancel: () => void) {
    this.title = title;
    this.onCancel = onCancel;
  }

  render(): HTMLElement {
    const row = document.createElement('div');
    row.className = 'snapshot-title-row';
    row.innerHTML = `<h1 class="snapshot-title">${this.title}</h1>`;

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-ghost';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.type = 'button';
    cancelBtn.addEventListener('click', this.onCancel);
    row.append(cancelBtn);
    return row;
  }
}
