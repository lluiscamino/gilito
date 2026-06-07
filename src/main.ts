import './ui/app.css';
import { registerSW } from 'virtual:pwa-register';
import { initApp } from './ui/app.ts';

registerSW({ immediate: true });
initApp(document.getElementById('app')!);
