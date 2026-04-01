export class Header {
  render(): HTMLElement {
    const header = document.createElement('header');
    header.innerHTML = `<span class="logo">Gilito</span>`;
    return header;
  }
}
