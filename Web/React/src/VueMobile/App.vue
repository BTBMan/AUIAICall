<template>
  <Welcome
    v-if="stateAgentType === undefined"
    @agent-type-selected="onAgentTypeSelected"
  />
  <Chat
    v-else-if="stateAgentType === AIChatAgentType.MessageChat"
    :user-id="userId"
    :user-token="userToken"
    :agent-id="agentId || runConfig.chatAgentId"
    :app-server="appServer"
    :template-config="
      templateConfig instanceof AIChatTemplateConfig
        ? templateConfig
        : runConfig.chatTemplateConfig
    "
    :user-data="userData || runConfig.chatUserData"
    @exit="onExit"
  />
  <Call
    v-else
    :user-id="userId"
    :user-token="userToken"
    :agent-type="stateAgentType"
    :share-token="shareToken"
    :agent-id="agentId || getCallAgentId(runConfig, stateAgentType)"
    :app-server="appServer"
    :region="region"
    :user-data="
      typeof userData === 'object'
        ? JSON.stringify(userData)
        : userData || runConfig.callUserData
    "
    :template-config="
      templateConfig instanceof AICallTemplateConfig
        ? templateConfig
        : runConfig.callTemplateConfig
    "
    @exit="onExit"
    @auth-fail="onAuthFail"
  />
</template>

<script lang="ts">
  import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
  import Welcome from './Welcome/index.vue';
  import Chat from './Chat/index.vue';
  import Call from './Call/index.vue';
  import runUserConfig from '@/runConfig.ts';
  import {
    AICallAgentType,
    AICallTemplateConfig,
    AIChatAgentType,
    AIChatTemplateConfig,
  } from 'aliyun-auikit-aicall';
  import { JSONObject } from '@/service/interface.ts';
  import { getCallAgentId, getRuntimeConfig } from '@/interface.ts';

  export default defineComponent({
    name: 'App',
    components: {
      Welcome,
      Chat,
      Call,
    },
    props: {
      userId: {
        type: String,
        default: 'YourUserId',
      },
      userToken: {
        type: String,
        default: 'YourToken',
      },
      shareToken: {
        type: String,
        default: undefined,
      },
      appServer: {
        type: String,
        default: undefined,
      },
      region: {
        type: String,
        default: undefined,
      },
      agentType: {
        type: String,
        default: undefined,
      },
      agentId: {
        type: String,
        default: undefined,
      },
      userData: {
        type: [String, Object],
        default: undefined,
      },
      templateConfig: {
        type: Object,
        default: undefined,
      },
      onAuthFail: {
        type: Function,
        default: undefined,
      },
    },
    setup(props) {
      const runConfig = getRuntimeConfig(runUserConfig);
      const stateAgentType = ref(props.agentType || runConfig.agentType);

      const onAgentTypeSelected = (type: AICallAgentType | AIChatAgentType) => {
        stateAgentType.value = type;
      };

      const onExit = () => {
        stateAgentType.value = undefined;
      };

      onMounted(() => {
        const preventContextMenu = function (e: Event) {
          e.preventDefault();
        };
        // 禁用右键菜单
        document.addEventListener('contextmenu', preventContextMenu);
      });

      onUnmounted(() => {
        const preventContextMenu = function (e: Event) {
          e.preventDefault();
        };
        document.removeEventListener('contextmenu', preventContextMenu);
      });

      return {
        runConfig,
        stateAgentType,
        onAgentTypeSelected,
        onExit,
        onAuthFail: props.onAuthFail,
        userId: props.userId,
        userToken: props.userToken,
        shareToken: props.shareToken,
        appServer: props.appServer || runConfig.appServer,
        region: props.region || runConfig.region,
        agentId: props.agentId,
        userData: props.userData,
        templateConfig: props.templateConfig,
        AIChatAgentType,
        AICallTemplateConfig,
        AIChatTemplateConfig,
        getCallAgentId,
      };
    },
  });
</script>

<style lang="less">
  html,
  body {
    height: 100%;
    margin: 0;
  }

  #root {
    position: relative;
    width: 100%;
    height: 100%;
    z-index: 9;
    margin: 0 auto;
    box-sizing: border-box;
    background-color: #fff;
    max-width: 576px;

    --adm-color-primary: #624aff;
    --adm-mask-z-index: 5;
    .adm-popup {
      position: static;
    }
    .adm-mask {
      position: absolute;
    }
    .adm-center-popup {
      position: static;
      .adm-center-popup-mask {
        z-index: 5;
      }
    }

    .adm-center-popup-wrap,
    .adm-popup-body {
      position: absolute;
      z-index: 5;
    }

    .adm-toast-mask .adm-toast-wrap {
      position: absolute;
    }
  }
</style>
