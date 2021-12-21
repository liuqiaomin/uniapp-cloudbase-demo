# 介绍

此项目在 uni-app 中使用腾讯云开发 cloudbase 的 demo

uni-app 需要安装适配器才能通过 @cloudbase/js-sdk 访问 cloudbase 提供的后端服务

适配器：utils/adapter.ts

你需要在 main.js 中将 init 中的选项改成你自己的才能正常运行

详细介绍↓

# uni-app + Cloudbase——uni-app 项目中如何使用腾讯云开发后端服务

## 1 基本介绍

uni-app 是一个基于 Vue.js 的跨端开发框架，一套代码可以发布到 App、小程序、Web 等不同平台

腾讯云开发平台 Cloudbase 提供的 [`@cloudbase/js-sdk`](https://www.npmjs.com/package/@cloudbase/js-sdk) 可以让开发者在 Web 端（例如 PC Web 页面、微信公众平台 H5 等）使用 JavaScript 访问 Cloudbase 服务和资源。

但是 `@cloudbase/js-sdk` 只支持 Web（浏览器环境）的开发，不兼容其他类 Web 平台（比如小程序）。因为这些平台在网络请求、本地存储、平台标识等特性上与浏览器环境有明显差异。

`@cloudbase/js-sdk` 不认识这些差异，比如`@cloudbase/js-sdk`不知道这些平台是怎么发送网络请求的，因此我们不能在开发类 Web 应用时直接使用`@cloudbase/js-sdk`。

针对这些差异，`@cloudbase/js-sdk`提供了一套完整的适配扩展方案，遵循此方案规范开发对应平台的适配器，就可以实现平台的兼容性

对于 uni-app，不同于浏览器，它基于 ECMAScript 扩展了独有的 uni 对象，它也不能直接使用`@cloudbase/js-sdk`，因为它在网络请求、本地存储等特性上和浏览器环境也存在明显差异

如果想让 uni-app 开发的小程序和 PC Web 应用使用同一套云开发后端服务，就需要开发针对 uni-app 的适配器

## 2 适配器

开发适配器之前需要安装官方提供的接口声明模块[`@cloudbase/adapter-interface`](https://www.npmjs.com/package/@cloudbase/adapter-interface)

```sh
# npm
npm i @cloudbase/adapter-interface
# yarn
yarn add @cloudbase/adapter-interface
```

适配器模块需要导出一个`adapter`对象：

```js
const adapter = {
  genAdapter,
  isMatch,
  // runtime标记平台唯一性
  runtime: '平台名称'
};

export adapter;
export default adapter;
```

必须包含以下三个字段：

- `runtime`: `string`，平台的名称，用于标记平台唯一性；
- `isMatch`: `Function`，判断当前运行环境是否为平台，返回`boolean`值；
- `genAdapter`: `Function`，创建`adapter`实体。

### runtime

`runtime`用于标记平台的唯一性

### isMatch

`isMatch`函数用于判断当前运行环境是否与适配器匹配，通常是通过判断平台特有的一些全局变量、API 等。

我们可以通过 uni 对象来判断是否为 uni-app

```js
function isMatch() {
    return uni ? true : false
}
```

### genAdapter

`genAdapter`函数返回适配器的实体对象，结构如下：

```typescript
interface SDKAdapterInterface {
  // 全局根变量，浏览器环境为window
  root: any;
  // WebSocket类
  wsClass: WebSocketContructor;
  // request类
  reqClass: SDKRequestConstructor;
  // 无localstorage时persistence=local降级为none
  localStorage?: StorageInterface;
  // 无sessionStorage时persistence=session降级为none
  sessionStorage?: StorageInterface;
  // storage模式首选，优先级高于persistence
  primaryStorage?: StorageType;
  // 获取平台唯一应用标识的api
  getAppSign?(): string;
}
```

我们只要使用 uni-app 提供的方法来实现指定的接口即可，示例：

```typescript
// Request类为平台特有的网络请求，必须实现post/upload/download三个public接口
export class UniRequest extends AbstractSDKRequest {
  // 实现post接口
  public post(options: IRequestOptions) {
    const { url, data, headers } = options
    return new Promise((resolve, reject) => {
      try {
        uni.request({
          url,
          data,
          header: headers,
          method: 'POST',
          success: (res) => {
            resolve(res)
          },
          fail: (err) => {
            reject(err)
          }
        })
      } catch (error) {
        reject(error)
      }
    });
  }
  // 实现upload接口
  public upload(options: IUploadRequestOptions) {
    const { url, file, name } = options
    return new Promise((resolve, reject) => {
      try {
        uni.uploadFile({
          url,
          filePath: file,
          name,
          success: (res) => {
            resolve(res)
          },
          fail: (err) => {
            reject(err)
          }
        })
      } catch (error) {
        reject(error)
      }
    });
  }
  // 实现download接口
  public download(options: IRequestOptions) {
    const { url } = options
    return new Promise((resolve, reject) => {
      try {
        uni.downloadFile({
          url,
          success: (res) => {
            resolve(res)
          },
          fail: (err) => {
            reject(err)
          }
        })
      } catch (error) {
        reject(error)
      }
    });
  }
}
// Storage为平台特有的本地存储，必须实现setItem/getItem/removeItem/clear四个接口
export const Storage: StorageInterface = {
  setItem(key: string, value: any) {
    uni.setStorage({
      key,
      data: value,
      success: (res) => {
        console.log(res);
      }
    })
  },
  getItem(key: string): any {
    return uni.getStorageSync(key)
  },
  removeItem(key: string) {
    uni.removeStorage({
      key,
      success: (res) => {
        res
      }
    })
  },
  clear() {
    uni.clearStorage()
  }
};
// WebSocket为平台特有的WebSocket，与HTML5标准规范一致
export class WebSocket {
  constructor(url: string, options: object = {}) {
    const socketTask: WebSocketInterface = {
      set onopen(cb) {
        // ...
      },
      set onmessage(cb) {
        // ...
      },
      set onclose(cb) {
        // ...
      },
      set onerror(cb) {
        // ...
      },
      send: (data) => {
        // ...
      },
      close: (code?: number, reason?: string) => {
        // ...
      },
      get readyState() {
        // ...
        return readyState;
      },
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3
    };
    return socketTask;
  }
}

// genAdapter函数创建adapter实体
function genAdapter() {
  const adapter: SDKAdapterInterface = {
    // root对象为全局根对象，没有则填空对象{}
    root: {},
    reqClass: UniRequest,
    wsClass: WebSocket as WebSocketContructor,
    localStorage: Storage,
    // 首先缓存存放策略，建议始终保持localstorage
    primaryStorage: StorageType.local,
    // sessionStorage为可选项，如果平台不支持可不填
    sessionStorage: sessionStorage
  };
  return adapter;
}
```

此处未实现 WebSocket ，若有需要可按需实现

## 3 接入流程

现在我们有了适配器，就可以愉快地在 uni-app 项目中使用 Cloudbase 了

### 第 1 步：安装并引入适配器

安装 @cloudbase/js-sdk 

```sh
# 安装 @cloudbase/js-sdk
npm i @cloudbase/js-sdk
```

在业务代码中引入适配器（这里我将适配器放在 utils 目录下）

```js
import cloudbase from "@cloudbase/js-sdk";
import adapter from '@/utils/adapter.ts'

cloudbase.useAdapters(adapter);
```

### 第 2 步：配置安全应用来源

登录[云开发 CloudBase 控制台](https://console.cloud.tencent.com/tcb)，在[安全配置](https://console.cloud.tencent.com/tcb/env/safety)页面中的移动应用安全来源一栏：

![](https://melonvin-1302080640.cos.ap-shanghai.myqcloud.com/987437125d4123504f8f7647ca3ea9da.png)

点击“添加应用”按钮，输入应用标识：比如 uniapp

![](https://melonvin-1302080640.cos.ap-shanghai.myqcloud.com/Snipaste_2021-12-20_15-36-40.png)

添加成功后会创建一个安全应用的信息，如下图所示： 

![](https://melonvin-1302080640.cos.ap-shanghai.myqcloud.com/6542df6800b71b91289bebc29d38de94.png)

### 第 3 步：初始化云开发

在业务代码中初始化云开发时将第 2 步配置的安全应用信息作为参数传递给 `init` 方法：

```js
import cloudbase from '@cloudbase/js-sdk';
import adapter from '@/utils/adapter.ts'

cloudbase.useAdapters(adapter);

cloudbase.init({
  env: '环境ID',
  appSign: '应用标识',
  appSecret: {
    appAccessKeyId: '应用凭证版本号'
    appAccessKey: '应用凭证'
  }
})
```

- 环境 ID 可以在环境总览中获取：

![](https://melonvin-1302080640.cos.ap-shanghai.myqcloud.com/Snipaste_2021-12-20_15-42-56.png)

- `appSign`：`string`，应用标识，对应移动应用安全来源中“应用标识”一栏（比如uniapp）

- `appSecret`：`Object`，应用凭证信息，包括以下字段：
  - `appAccessKeyId`：`string`，对应移动应用安全来源中“版本”一栏，**同一个应用标识可以最多可以添加两个版本的凭证信息**，以便区分开发和生产环境；
  - `appAccessKey`：`string`，对应移动应用安全来源中“操作”一栏点击“获取凭证”之后获取到的信息。

### 第 4 步：编写业务代码

经过以上准备工作之后便可以编写自身的业务代码。

比如我们要访问云函数 test :

```js
const tcb = cloudbase.init({
	env: '环境id',
	appSign: 'uniapp',
	appSecret: {
		appAccessKeyId: '1',
		appAccessKey:'应用凭证'
	}
})
 
tcb.callFunction({
	name: 'test'
}).then(res => {
	console.log(res)
})
```

## 4 访问权限问题

经过上述准备工作以后，我们可能仍然无法访问云函数、云数据库、云存储等资源，控制台出现如下信息：

![](https://melonvin-1302080640.cos.ap-shanghai.myqcloud.com/Snipaste_2021-12-20_16-03-13.png)

这时可以查看访问权限，以**云函数**为例：

### 4.1 权限控制

点击云函数的权限控制按钮

![](https://melonvin-1302080640.cos.ap-shanghai.myqcloud.com/Snipaste_2021-12-21_08-57-05.png)

对云函数访问权限进行配置，比如下面将`test`权限配置成`true`

![](https://melonvin-1302080640.cos.ap-shanghai.myqcloud.com/Snipaste_2021-12-21_08-58-02.png)

### 4.2 登录授权

打开登录授权中的“未登录”选项，不登录即可访问应用

![](https://melonvin-1302080640.cos.ap-shanghai.myqcloud.com/Snipaste_2021-12-21_09-12-01.png)

现在，就可以愉快地访问了~

![](https://melonvin-1302080640.cos.ap-shanghai.myqcloud.com/Snipaste_2021-12-21_09-13-18.png)

