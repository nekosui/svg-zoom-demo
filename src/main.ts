import './main.styl'

import { createApp } from 'vue'
import store from './stores'

import App from './views/app'
import router from './router'

const app = createApp(App)

app.use(store)
app.use(router)

app.mount(document.getElementById('app') as HTMLElement)


const mqList = window.matchMedia('(prefers-color-scheme: dark)');
(document.body.parentElement as HTMLElement).dataset.bsTheme = mqList.matches ? 'dark' : 'light';
mqList.addEventListener('change', (event) => {
  // is dark mode
  if (event.matches) {
    (document.body.parentElement as HTMLElement).dataset.bsTheme = "dark"
  } else {
    // not dark mode
    (document.body.parentElement as HTMLElement).dataset.bsTheme = "light"
  }
})