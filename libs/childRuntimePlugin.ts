// @ts-nocheck
import { createHistory } from '@@/core/history';
import qiankunRender, { clientRenderOptsStack } from './lifecycles';

export function render(oldRender: any) {
  return qiankunRender().then(oldRender);
}

function modifyRoutesWithAttachMode({ routes, base }) {
  if (!routes.length) return;
  routes.forEach((route) => {
    if (route.path) {
      const path = route.path[0] === '/' ? route.path : `/${route.path}`;
      // 防止重复添加前缀
      if (path.startsWith(base)) return path;
      route.path = base + route.path;
    }
    if (route.children?.length) {
      modifyRoutesWithAttachMode({
        routes: route.children,
        base
      });
    }
  });
}

export function modifyClientRenderOpts(memo) {
  // 每次应用 render 的时候会调 modifyClientRenderOpts，这时尝试从队列中取 render 的配置
  const clientRenderOpts = clientRenderOptsStack.shift();
  const { basename, historyType, routes } = memo;
  // use ?? instead of ||, incase clientRenderOpts.basename is ''
  // only break when microApp has a config.base and mount path is /*
  const newBasename = clientRenderOpts?.basename ?? basename;
  const newHistoryType = clientRenderOpts?.historyType || historyType;

  if (newHistoryType !== historyType || newBasename !== basename) {
    clientRenderOpts.history = createHistory({
      type: newHistoryType,
      basename: newBasename,
      ...clientRenderOpts.historyOpts
    });
  }

  // 运行环境是乾坤且检测 hash 路由时，进行重写子系统理由，添加路由前缀
  if (window.__POWERED_BY_QIANKUN__ && historyType === 'hash') {
    const base = clientRenderOpts.history.base;
    const routesArray = Object.values(routes);

    modifyRoutesWithAttachMode({ routes: routesArray, base });
  }

  return {
    ...memo,
    ...clientRenderOpts,
    basename: newBasename,
    historyType: newHistoryType
  };
}
