import {
  AbstractSDKRequest,
  IRequestOptions,
  IUploadRequestOptions,
  StorageInterface,
  WebSocketInterface,
  WebSocketContructor,
  SDKAdapterInterface,
  StorageType,
  formatUrl
} from '@cloudbase/adapter-interface'

function isMatch(): boolean {
  return uni ? true : false
}

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

const adapter = {
  genAdapter,
  isMatch,
  runtime: 'uniapp'
}

export default adapter
