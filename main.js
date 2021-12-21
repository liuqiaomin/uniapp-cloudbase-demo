import App from './App'
import cloudbase from '@cloudbase/js-sdk'
import adapter from '@/utils/adapter.ts'
cloudbase.useAdapters(adapter)
 
const tcb = cloudbase.init({
	env: '环境id',
	appSign: '应用标识',
	appSecret: {
		appAccessKeyId: '应用凭证版本号',
		appAccessKey:'应用凭证'
	}
})
     
tcb.callFunction({
	name: 'test'
}).then(res => {
	console.log(res)
})
 
 
// #ifndef VUE3
import Vue from 'vue'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
    ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}
// #endif