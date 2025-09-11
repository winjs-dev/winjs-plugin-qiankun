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
            child: zod.record(zod.any()),
          })
          .deepPartial();
      },
    },
  });

  api.addRuntimePluginKey(() => ['qiankun']);

  api.registerPlugins([require.resolve('./child')]);
};
