<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue'
import {
  AICallAgentType,
  AICallTemplateConfig,
  AIChatAgentType,
  AIChatTemplateConfig,
} from 'aliyun-auikit-aicall'
import Call from './Call/index.vue'
import runUserConfig from './runConfig'
import { getCallAgentId, getRuntimeConfig } from './interface'

export default defineComponent({
  name: 'AliAIChat',
  components: {
    Call,
  },
  props: {
    userId: {
      type: String,
      default: '210457171',
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
    const runConfig = getRuntimeConfig(runUserConfig)
    const stateAgentType = ref(props.agentType || runConfig.agentType)

    const onAgentTypeSelected = (type: AICallAgentType | AIChatAgentType) => {
      stateAgentType.value = type
    }

    const onExit = () => {
      // stateAgentType.value = undefined
    }

    onMounted(() => {
      const preventContextMenu = function (e: Event) {
        e.preventDefault()
      }
      // 禁用右键菜单
      document.addEventListener('contextmenu', preventContextMenu)
      onAgentTypeSelected(AICallAgentType.VoiceAgent)
    })

    onUnmounted(() => {
      const preventContextMenu = function (e: Event) {
        e.preventDefault()
      }
      document.removeEventListener('contextmenu', preventContextMenu)
    })

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
      AICallAgentType,
    }
  },
})
</script>

<template>
  <div id="ai-chat" hfull wfull of-hidden rd-5px bg-white style="box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.1);">
    <Call
      v-if="stateAgentType === AICallAgentType.VoiceAgent"
      :user-id="userId"
      :user-token="userToken"
      :agent-type="(stateAgentType as any)"
      :share-token="shareToken"
      :agent-id="((agentId || getCallAgentId(runConfig, stateAgentType as any)) as any)"
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
      @auth-fail="(onAuthFail as any)"
    />
    <!-- <el-button @click="onAgentTypeSelected(AICallAgentType.VoiceAgent)">
        开始体验
      </el-button> -->
  </div>
</template>

<style lang="scss">
#root {
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

#ai-chat {
  .el-button {
    svg {
      display: inline !important;
    }
  }
}
</style>
