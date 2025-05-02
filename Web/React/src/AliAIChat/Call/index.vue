<!-- eslint-disable vue/custom-event-name-casing -->
<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'
import type {
  AICallChatSyncConfig,
} from 'aliyun-auikit-aicall'
import {
  AICallAgentType,
  AICallTemplateConfig,
} from 'aliyun-auikit-aicall'
import { isAndroidWeChatBrowser } from '../common/utils'
import AUIAICallStandardController from '../controller/call/AUIAICallStandardController'
import Stage from './Stage.vue'
import { useCallStore } from './store'
import { ControllerContextKey } from './provider'

export default defineComponent({
  name: 'Call',
  components: {
    Stage,
  },
  props: {
    userId: {
      type: String,
      required: true,
    },
    userToken: {
      type: String,
      required: true,
    },
    agentType: {
      type: String,
      required: true,
    },
    autoCall: {
      type: Boolean,
      default: undefined,
    },
    shareToken: {
      type: String,
      default: undefined,
    },
    fromShare: {
      type: Boolean,
      default: false,
    },
    agentId: {
      type: String,
      default: undefined,
    },
    appServer: {
      type: String,
      required: true,
    },
    region: {
      type: String,
      default: undefined,
    },
    userData: {
      type: String,
      default: undefined,
    },
    templateConfig: {
      type: Object,
      default: undefined,
    },
    chatSyncConfig: {
      type: Object as () => AICallChatSyncConfig,
      default: undefined,
    },
    rtcEngineConfig: {
      type: Object as () => {
        environment?: 'PRE' | 'PROD'
        useAudioPlugin?: boolean
        dumpAudio?: boolean
      },
      default: undefined,
    },
  },
  emits: ['exit', 'auth-fail'],
  setup(props, { emit }) {
    const controllerRef = ref<AUIAICallStandardController | null>(null)

    const shouldAutoCall = computed(() => {
      const urlParams = new URLSearchParams(window.location.search)
      const hasNoCallParam = urlParams.get('nocall') !== null

      if (props.autoCall !== undefined) {
        return props.autoCall
      }

      // 微信安卓端自动播放会失败，分享场景需要手动点击通话
      if (
        hasNoCallParam
        || (controllerRef.value?.config.fromShare && isAndroidWeChatBrowser())
      ) {
        return false
      }

      return true
    })

    const beforeOnload = () => {
      controllerRef.value?.handup()
    }

    onMounted(() => {
      initCall()

      // 关闭页面时尝试挂断，减少出现 Agent 需要超时才能退出的情况
      window.addEventListener('beforeunload', beforeOnload)
    })

    onUnmounted(() => {
      // 清理事件监听
      window.removeEventListener('beforeunload', beforeOnload)

      controllerRef.value?.destroy()
    })

    onMounted(() => {
      initCall()
    })

    async function initCall() {
      const {
        userId,
        userToken,
        shareToken,
        fromShare,
        agentId,
        agentType,
        appServer,
        region,
        userData,
        templateConfig,
        chatSyncConfig,
        rtcEngineConfig,
      } = props

      try {
        if (controllerRef.value) {
          controllerRef.value.destroy()
          controllerRef.value = null
        }

        if (!userId || !userToken)
          return null

        useCallStore().setState({
          agentType: agentType as unknown as AICallAgentType,
        })

        const controller = new AUIAICallStandardController(userId, userToken)

        if (shareToken) {
          controller.shareConfig = shareToken

          if (!controller.shareConfig) {
            ElMessage.error({
              message: '分享链接有误',
            })
            return
          }

          if (controller.shareConfig.templateConfig) {
            controller.config.templateConfig
              = AICallTemplateConfig.fromJsonString(
                controller.shareConfig?.agentType
                || AICallAgentType.VoiceAgent,
                controller.shareConfig?.templateConfig,
              )
          }

          controller.config.fromShare = true
        }
        else {
          controller.config.fromShare = !!fromShare

          if (agentId) {
            controller.config.agentId = agentId
          }

          if (chatSyncConfig) {
            controller.config.chatSyncConfig = chatSyncConfig
          }
        }

        if (appServer)
          controller.appServer = appServer
        if (rtcEngineConfig)
          controller.config.rtcEngineConfig = rtcEngineConfig
        if (region)
          controller.config.region = region
        if (userData) {
          controller.config.userData = userData
        }
        if (templateConfig) {
          controller.config.templateConfig = templateConfig as any
        }

        controllerRef.value = controller
      }
      catch (error) {
        console.error('Failed to initialize call:', error)
      }
    }

    const onExitClick = () => {
      // if (controllerRef.value) {
      //   controllerRef.value.destroy()
      //   controllerRef.value = null
      // }
      emit('exit')
    }

    const onAuthFail = () => {
      emit('auth-fail')
    }

    provide(ControllerContextKey, reactive(controllerRef))

    return {
      controllerRef,
      shouldAutoCall,
      onExitClick,
      onAuthFail,
      agentType: props.agentType as any,
    }
  },
})
</script>

<template>
  <Stage
    :agent-type="agentType"
    :auto-call="shouldAutoCall"
    @auth-fail="onAuthFail"
    @exit="onExitClick"
  />
</template>

<style lang="scss">
  .call-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: #000;
}
</style>
