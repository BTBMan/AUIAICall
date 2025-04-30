# AUIAICall Vue3 移动端版本

这是 AUIAICall 移动端 React 版本的 Vue3 实现。

## 文件结构

```
src/VueMobile/
  ├── main.ts                # 入口文件
  ├── App.vue                # 主应用组件
  ├── Call/                  # 通话相关组件
  │   ├── index.vue          # 通话主组件
  │   ├── store.ts           # 通话状态管理
  │   ├── ControlerContext.vue # 通话控制器上下文
  │   └── ...                # 其他通话相关组件
  ├── Chat/                  # 聊天相关组件
  │   ├── index.vue          # 聊天主组件
  │   ├── store.ts           # 聊天状态管理
  │   ├── ChatEngineContext.vue # 聊天引擎上下文
  │   ├── State.vue          # 聊天状态组件
  │   ├── resizeHandler.ts   # 处理移动端键盘弹出
  │   └── ...                # 其他聊天相关组件
  └── Welcome/               # 欢迎页组件
      └── index.vue          # 欢迎页主组件
```

## 依赖项

在使用此 Vue3 版本之前，您需要安装以下依赖：

```bash
npm install vue@^3.2.0 vant@^4.0.0 aliyun-auikit-aicall
```

或使用 yarn：

```bash
yarn add vue@^3.2.0 vant@^4.0.0 aliyun-auikit-aicall
```

## 使用方法

1. 在您的 Vue3 项目中引入并使用 `App.vue` 组件：

```vue
<template>
  <div>
    <aui-ai-call-mobile />
  </div>
</template>

<script>
  import AuiAiCallMobile from './VueMobile/App.vue';

  export default {
    components: {
      AuiAiCallMobile,
    },
  };
</script>
```

2. 如果需要自定义配置，可以传入 props：

```vue
<template>
  <div>
    <aui-ai-call-mobile
      :user-id="userId"
      :user-token="userToken"
      :agent-id="agentId"
      :app-server="appServer"
      :region="region"
    />
  </div>
</template>

<script>
  import AuiAiCallMobile from './VueMobile/App.vue';

  export default {
    components: {
      AuiAiCallMobile,
    },
    data() {
      return {
        userId: 'YourUserId',
        userToken: 'YourToken',
        agentId: 'YourAgentId',
        appServer: 'https://your-app-server.com',
        region: 'cn-hangzhou',
      };
    },
  };
</script>
```

## 注意事项

1. 此代码为 React 版本的 Vue3 实现，保持了相同的功能和 UI 结构。
2. 使用了 Vant UI 库替代了原先的 antd-mobile，如需完全匹配原始 UI，可能需要进一步调整样式。
3. 部分组件可能需要根据您的实际项目进行进一步完善。

## 样式说明

样式直接复用了原 React 版本的 less 文件。您可能需要确保项目中已经配置了对 less 文件的支持。
