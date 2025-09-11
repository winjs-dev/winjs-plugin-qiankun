/**
 * qiankun
 * @Author: liwb (lwbhtml@163.com)
 * @Date: 2024-05-30 15:38
 * @LastEditTime: 2024-05-30 15:38
 * @Description: qiankun
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { join } from 'path';
import { lodash, withTmpPath } from '@winner-fed/utils';
import { IApi, RUNTIME_TYPE_FILE_NAME } from 'win';

export function isChildEnable(opts: { userConfig: any }) {
  return !!opts.userConfig?.qiankun?.child || lodash.isEqual(opts.userConfig?.qiankun, {});
}

export default (api: IApi) => {
  api.describe({
    key: 'qiankun-child',
    enableBy: () => isChildEnable(api)
  });

  api.addRuntimePlugin(() => {
    return [withTmpPath({ api, path: 'childRuntimePlugin.ts' })];
  });

  api.onGenerateFiles(() => {
    api.writeTmpFile({
      path: RUNTIME_TYPE_FILE_NAME,
      content: `
interface LifeCycles {
    bootstrap?: (props?: any) => Promise<any>;
    mount?: (props?: any) => Promise<any>;
    unmount?: (props?: any) => Promise<any>;
    update?: (props?: any) => Promise<any>;
}
type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = (Without<T, U> & U) | (Without<U, T> & T);
interface ChildOption extends LifeCycles {
    enable?: boolean;
}
interface Config {
    child?: ChildOption;
}
export interface IRuntimeConfig {
    qiankun?: XOR<Config, LifeCycles>
}
      `,
    });
  });

  api.modifyDefaultConfig((memo) => {
    const initialMicroOptions = {
      devSourceMap: true,
      ...(memo.qiankun || {}).child
    };
    const modifiedDefaultConfig = {
      ...memo,
      // 默认开启 runtimePublicPath，避免出现 dynamic import 场景子应用资源地址出问题
      runtimePublicPath: true,
      qiankun: {
        ...memo.qiankun,
        child: initialMicroOptions
      }
    };

    const shouldNotModifyDefaultBase = api.userConfig.qiankun?.child?.shouldNotModifyDefaultBase ?? initialMicroOptions.shouldNotModifyDefaultBase;
    const historyType = api.userConfig.history?.type || 'browser';
    if (!shouldNotModifyDefaultBase && historyType !== 'hash') {
      modifiedDefaultConfig.base = `/${api.pkg.name}`;
    }

    if (modifiedDefaultConfig.mfsu !== false) {
      modifiedDefaultConfig.mfsu = {
        ...modifiedDefaultConfig.mfsu,
        mfName:
          modifiedDefaultConfig.mfsu?.mfName ||
          `mf_${api.pkg.name
            // 替换掉包名里的特殊字符
            // e.g. @umi/ui -> umi_ui
            ?.replace(/^@/, '')
            .replace(/\W/g, '_')}`,
      };
    }

    return modifiedDefaultConfig;
  });
//
  api.addHTMLHeadScripts(() => {
    const dontModify =
      api.config.qiankun?.child?.shouldNotModifyRuntimePublicPath;
    return dontModify
      ? []
      : [
        `
        __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
        window.publicPath = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__ || "${
          api.config.publicPath || '/'
        }";`,
      ];
  });

  api.chainWebpack((config) => {
    assert(api.pkg.name, 'You should have name in package.json.');

    // mfsu 线上不会开启，所以这里只需要判断本地是否开启即可
    const {
      shouldNotAddLibraryChunkName = api.env === 'production' ||
        !Boolean(api.config.mfsu),
    } = (api.config.qiankun || {}).child!;
    config.output
      .libraryTarget('umd')
      .library(
        shouldNotAddLibraryChunkName ? api.pkg.name : `${api.pkg.name}-[name]`,
      );
    // TODO: SOCKET_SERVER
    // TODO: devSourceMap
    return config;
  });

  // win bundle 添加 entry 标记
  api.modifyHTML(($) => {
    $('script').each((_: any, el: any) => {
      const scriptEl = $(el);
      const winEntry = /\/?win(\.\w+)?\.js$/g;
      if (winEntry.test(scriptEl.attr('src') ?? '')) {
        scriptEl.attr('entry', '');
      }
    });
    return $;
  });

  api.addEntryImports(() => {
    return [
      {
        source: '@@/plugin-qiankun-child/lifecycles',
        specifier:
          '{ genMount as qiankun_genMount, genBootstrap as qiankun_genBootstrap, genUnmount as qiankun_genUnmount, genUpdate as qiankun_genUpdate }',
      },
    ];
  });

  api.addEntryCode(() => [
    `
export const bootstrap = qiankun_genBootstrap(render);
export const mount = qiankun_genMount('${api.config.mountElementId}');
export const unmount = qiankun_genUnmount('${api.config.mountElementId}');
export const update = qiankun_genUpdate();
if (!window.__POWERED_BY_QIANKUN__) {
  bootstrap().then(mount);
}
    `,
  ]);

  function getFileContent(file: string) {
    return readFileSync(
      join(__dirname, '../../libs', file),
      'utf-8',
    );
  }

  api.onGenerateFiles({
    fn() {
      [
        'childRuntimePlugin.ts',
        'lifecycles.ts',
      ].forEach((file) => {
        api.writeTmpFile({
          path: file.replace(/\.tpl$/, ''),
          content: getFileContent(file)
        });
      });

      api.writeTmpFile({
        path: 'index.ts',
        content: `
export const isQiankun = () => window.__POWERED_BY_QIANKUN__;
      `,
      });
    }
  });

}
