export class SignInScreen {
  private readonly onSignIn: () => void;

  constructor(onSignIn: () => void) {
    this.onSignIn = onSignIn;
  }

  render(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'sign-in-screen';

    const wordmark = document.createElement('div');
    wordmark.className = 'sign-in-screen__wordmark';

    const title = document.createElement('h1');
    title.className = 'sign-in-screen__title';
    title.textContent = 'gilito';

    const subtitle = document.createElement('p');
    subtitle.className = 'sign-in-screen__subtitle';
    subtitle.textContent = 'Your personal wealth tracker';

    wordmark.append(title, subtitle);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sign-in-screen__btn';
    const logo = document.createElement('img');
    logo.src = '/google.svg';
    logo.alt = '';
    logo.className = 'sign-in-screen__google-logo';
    btn.append(logo, 'Sign in with Google');
    btn.addEventListener('click', this.onSignIn);

    el.append(wordmark, btn);
    return el;
  }
}
