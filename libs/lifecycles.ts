/**
 * lifecycle
 * @Author: liwb (lwbhtml@163.com)
 * @Date: 2024-05-30 15:35
 * @LastEditTime: 2024-05-30 15:35
 * @Description: lifecycle
 */
// @ts-nocheck
import { getPluginManager } from '@@/core/plugin';
import { ApplyPluginsType } from '@@/exports';

const noop = () => {
};

type Defer = {
  promise: Promise<any>;
  resolve(value?: any): void;
};

// @ts-ignore
const defer: Defer = {};
defer.promise = new Promise((resolve) => {
  defer.resolve = resolve;
});

let render = noop;
let hasMountedAtLeastOnce = false;
let cacheAppPromise = null;
const cache = {};

export default () => defer.promise;

export const clientRenderOptsStack = [];

function normalizeHistory(
  history?: 'string' | Record<string, any>,
  base?: string
) {
  let normalizedHistory: Record<string, any> = {};
  if (base) normalizedHistory.basename = base;
  if (history) {
    if (typeof history === 'string') {
      normalizedHistory.type = history;
    } else {
      normalizedHistory = history;
    }
  }

  return normalizedHistory;
}

async function getChildRuntime() {
  const config = await getPluginManager().applyPlugins({
    key: 'qiankun',
    type: ApplyPluginsType.modify,
    initialValue: {},
    async: true
  });
  // 应用既是 main 又是 child 的场景，运行时 child 配置方式为 export const qiankun = { child: {} }
  const { child } = config;
  return child || config;
}

// 子应用生命周期钩子Bootstrap
export function genBootstrap(oldRender: typeof noop) {
  return async (props: any) => {
    if (typeof props !== 'undefined') {
      const childRuntime = await getChildRuntime();
      if (childRuntime.bootstrap) {
        await childRuntime.bootstrap(props);
      }
    }
    render = oldRender;
  };
}

// 子应用生命周期钩子Mount
export function genMount(mountElementId) {
  return async (props?: any) => {
    // props 有值时说明应用是通过 lifecycle 被主应用唤醒的，而不是独立运行时自己 mount
    if (typeof props !== 'undefined') {
      const childRuntime = await getChildRuntime();
      if (childRuntime.mount) {
        await childRuntime.mount(props);
      }

      const { type, ...historyOpts } = normalizeHistory(
        props?.history || {},
        props?.base
      );

      // 更新 clientRender 配置
      const clientRenderOpts = {
        callback: () => {
          // 默认开启
          // 如果需要手动控制 loading，通过主应用配置 props.autoSetLoading false 可以关闭
          if (props.autoSetLoading && typeof props.setLoading === 'function') {
            props.setLoading(false);
          }

          // 支持将子应用的 history 回传给父应用
          if (typeof props?.onHistoryInit === 'function') {
            props.onHistoryInit(history);
          }
        },
        // 支持通过 props 注入 container 来限定子应用 mountElementId 的查找范围
        // 避免多个子应用出现在同一主应用时出现 mount 冲突
        rootElement:
          props.container?.querySelector(`#${mountElementId}`) ||
          document.getElementById(mountElementId),

        // 乾坤环境则使用主应用前缀 history 模式
        basename: window.__POWERED_BY_QIANKUN__ ? props.routerPrefix : props.base,

        // 支持 MicroAppWithMemoHistory 需要
        historyType: type,
        historyOpts: historyOpts
      };

      clientRenderOptsStack.push(clientRenderOpts);
    }

    // 第一次 mount 会自动触发 render，非第一次 mount 则需手动触发
    if (hasMountedAtLeastOnce) {
      cacheAppPromise = render();
      cacheAppPromise.then((app) => {
        if (props?.name && !cache[props.name]) {
          cache[props.name] = app;
        }
      });
    } else {
      defer.resolve();
    }
    hasMountedAtLeastOnce = true;
  };
}

export function genUpdate() {
  return async (props: any) => {
    const childRuntime = await getChildRuntime();
    if (childRuntime.update) {
      await childRuntime.update(props);
    }
  };
}

// 子应用生命周期钩子Unmount
export function genUnmount() {
  return async (props: any) => {
    if (cache[props.name]) {
      setTimeout(() => {
        let { app, router } = cache[props.name];
        app.$destroy();
        app.$el.innerHTML = '';
        app = null;
        router = null;
        delete cache[props.name];
        cacheAppPromise = null;
      }, 0);
    }
    const childRuntime = await getChildRuntime();
    if (childRuntime.unmount) {
      await childRuntime.unmount(props);
    }
  };
}
