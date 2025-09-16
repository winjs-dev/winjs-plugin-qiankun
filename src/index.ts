/**
 * qiankun
 * @Author: liwb (lwbhtml@163.com)
 * @Date: 2025-09-11 09:33
 * @Description: 适配乾坤主应用的子应用改造
 */
import type { IApi } from '@winner-fed/winjs';

export default (api: IApi) => {
  api.describe({
    key: 'qiankun',
    config: {
      schema({ zod }) {
        return zod
          .object({
            child: zod
              .record(zod.any())
              .describe(
                '乾坤微前端子应用配置对象。用于将当前应用适配为乾坤主应用的子应用，支持微前端生命周期管理。配置项包括：enable（是否启用子应用功能）、bootstrap/mount/unmount/update（微前端生命周期钩子函数）、shouldNotModifyDefaultBase（是否修改默认 base 路径）、shouldNotModifyRuntimePublicPath（是否修改运行时公共路径）、shouldNotAddLibraryChunkName（是否添加库块名称）、devSourceMap（开发环境源码映射）等选项。插件会自动配置 webpack library 输出、处理资源路径、生成生命周期文件和运行时插件。',
              )
              .optional(),
          })
          .describe(
            '乾坤微前端插件配置。专为乾坤（qiankun）微前端框架设计，将当前 WinJS 应用改造为可被乾坤主应用加载的子应用。插件会自动处理子应用的生命周期管理、资源路径配置、模块联邦设置等，确保应用在微前端环境中正常运行。',
          )
          .deepPartial();
      },
    },
  });

  api.addRuntimePluginKey(() => ['qiankun']);

  api.registerPlugins([require.resolve('./child')]);
};
