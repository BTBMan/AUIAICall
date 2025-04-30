import { createApp } from 'vue';
import App from './App.vue';
import { addRootClass } from '@/common/utils.ts';

const root = document.getElementById('root');
if (!root) throw new Error('root element not found');
addRootClass(root);

const app = createApp(App);
app.mount('#root');
