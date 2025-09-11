# winjs-plugin-qiankun

适配 WinJS 的微前端 qiankun 子应用插件。

<p>
  <a href="https://npmjs.com/package/@winner-fed/plugin-qiankun">
   <img src="https://img.shields.io/npm/v/@winner-fed/plugin-qiankun?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
  <a href="https://npmcharts.com/compare/@winner-fed/plugin-qiankun?minimal=true"><img src="https://img.shields.io/npm/dm/@winner-fed/plugin-qiankun.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" /></a>
</p>


## 功能特性

- 🚀 **自动化子应用改造**: 自动将 WinJS 应用改造为 qiankun 子应用
- 📦 **完整生命周期支持**: 提供 bootstrap、mount、unmount、update 生命周期钩子
- 🔧 **智能路由配置**: 自动处理路由前缀和公共路径，支持 hash 和 browser 模式
- 🎯 **运行时检测**: 提供运行时检测函数，判断是否在 qiankun 环境中运行
- 📊 **缓存机制**: 内置应用实例缓存，优化性能
- 🔄 **热重载支持**: 开发环境支持热重载调试

## 安装

```bash
npm install @winner-fed/plugin-qiankun
# 或
yarn add @winner-fed/plugin-qiankun
# 或
pnpm add @winner-fed/plugin-qiankun
```

## 基础使用

### 1. 在 WinJS 项目中启用插件

在 `.winrc.ts` 配置文件中添加插件：

```typescript
import { defineConfig } from 'win';

export default defineConfig({
  plugins: [
    require.resolve('@winner-fed/plugin-qiankun')
  ],
  qiankun: {
    child: {}
  }
});
```

### 2. 基础配置

```typescript
export default defineConfig({
  plugins: [
    require.resolve('@winner-fed/plugin-qiankun')
  ],
  qiankun: {
    child: {
      enable: true,
      devSourceMap: true,
      shouldNotModifyDefaultBase: false,
      shouldNotModifyRuntimePublicPath: false,
      shouldNotAddLibraryChunkName: false
    }
  }
});
```

## 配置选项

### child 配置

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enable` | `boolean` | `true` | 是否启用子应用功能 |
| `devSourceMap` | `boolean` | `true` | 开发环境是否启用 source map |
| `shouldNotModifyDefaultBase` | `boolean` | `false` | 是否不修改默认的 base 路径 |
| `shouldNotModifyRuntimePublicPath` | `boolean` | `false` | 是否不修改运行时公共路径 |
| `shouldNotAddLibraryChunkName` | `boolean` | `false` | 是否不添加库 chunk 名称 |

### 生命周期钩子

```typescript
export default defineConfig({
  qiankun: {
    child: {
      bootstrap: async (props) => {
        console.log('子应用启动', props);
      },
      mount: async (props) => {
        console.log('子应用挂载', props);
      },
      unmount: async (props) => {
        console.log('子应用卸载', props);
      },
      update: async (props) => {
        console.log('子应用更新', props);
      }
    }
  }
});
```

## 运行时 API

### isQiankun()

判断当前应用是否运行在 qiankun 环境中：

```javascript
import { isQiankun } from '@@/plugin-qiankun-child';

if (isQiankun()) {
  console.log('当前运行在 qiankun 环境中');
} else {
  console.log('当前独立运行');
}
```

### 运行时配置

在 `src/app.js` 中进行运行时配置：

```javascript
export const qiankun = {
  child: {
    bootstrap: async (props) => {
      console.log('子应用启动', props);
    },
    mount: async (props) => {
      console.log('子应用挂载', props);
      // 处理主应用传递的 props
      if (props.token) {
        // 设置认证信息
        localStorage.setItem('token', props.token);
      }
    },
    unmount: async (props) => {
      console.log('子应用卸载', props);
      // 清理资源
      localStorage.removeItem('token');
    },
    update: async (props) => {
      console.log('子应用更新', props);
    }
  }
};
```

## 高级功能

### 路由配置

插件会自动处理路由前缀，支持以下场景：

1. **Browser 模式**: 自动添加 `/${packageName}` 前缀
2. **Hash 模式**: 自动重写路由，添加路由前缀
3. **自定义前缀**: 通过主应用传递的 `routerPrefix` 配置

```javascript
// 路由配置示例
export const router = {
  scrollBehavior(to, from) {
    // 自定义滚动行为
    return { top: 0 };
  }
};
```

### 历史模式支持

```javascript
export const qiankun = {
  child: {
    mount: async (props) => {
      // 主应用可以传递历史模式配置
      const { history } = props;
      if (history) {
        console.log('使用主应用指定的历史模式:', history);
      }
    }
  }
};
```

### 加载状态管理

```javascript
export const qiankun = {
  child: {
    mount: async (props) => {
      // 手动控制加载状态
      if (props.setLoading) {
        props.setLoading(true);
        
        // 执行初始化逻辑
        await initializeApp();
        
        // 完成后关闭加载状态
        props.setLoading(false);
      }
    }
  }
};
```

## 最佳实践

### 1. 应用隔离

确保子应用的样式和全局变量不会影响主应用：

```css
/* 在子应用中使用 scoped 样式 */
.my-app {
  /* 子应用样式 */
}
```

### 2. 状态管理

```javascript
// 使用 Vuex 或 Pinia 进行状态管理
export const qiankun = {
  child: {
    mount: async (props) => {
      // 从主应用获取初始状态
      if (props.initialState) {
        store.commit('setInitialState', props.initialState);
      }
    },
    unmount: async (props) => {
      // 清理状态
      store.commit('reset');
    }
  }
};
```

### 3. 通信机制

```javascript
export const qiankun = {
  child: {
    mount: async (props) => {
      // 监听主应用消息
      if (props.onGlobalStateChange) {
        props.onGlobalStateChange((state, prev) => {
          console.log('全局状态变化:', state, prev);
        });
      }
      
      // 向主应用发送消息
      if (props.setGlobalState) {
        props.setGlobalState({
          childAppLoaded: true
        });
      }
    }
  }
};
```

## 注意事项

1. **包名配置**: 确保 `package.json` 中有正确的 `name` 字段
2. **public-path**: 插件会自动处理 `publicPath`，一般不需要手动配置
3. **样式隔离**: 建议使用 CSS Modules 或 styled-components 避免样式冲突
4. **资源加载**: 确保静态资源路径正确，避免在子应用中使用绝对路径

## 故障排除

### 常见问题

1. **子应用无法正常加载**
    - 检查 `package.json` 中的 `name` 字段
    - 确认主应用的 `entry` 配置正确

2. **路由跳转异常**
    - 检查路由配置是否正确
    - 确认 `base` 配置是否符合预期

3. **样式冲突**
    - 使用 CSS Modules 或 scoped 样式
    - 避免全局样式污染

### 调试技巧

```javascript
// 开启调试模式
export const qiankun = {
  child: {
    mount: async (props) => {
      console.log('子应用 props:', props);
      console.log('是否在 qiankun 环境:', window.__POWERED_BY_QIANKUN__);
    }
  }
};
```

## 许可证

[MIT](./LICENSE).
