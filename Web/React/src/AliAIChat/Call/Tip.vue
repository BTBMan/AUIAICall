<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'
import { AICallAgentState, AICallState } from 'aliyun-auikit-aicall'
import { useCallStore } from './store'

export default defineComponent({
  name: 'CallTip',
  props: {
    text: {
      type: String,
      default: '',
    },
  },
  setup() {
    const seconds = ref(0)
    const hasSpeaked = ref(false)
    let durationTimer: number | null = null
    let startTime = 0

    // 简化实现，实际应从 store 中获取
    const { callState, agentState, isSpeaking, enableVoiceInterrupt } = storeToRefs(useCallStore())

    watch(isSpeaking, (newVal) => {
      if (newVal) {
        hasSpeaked.value = true
      }
    })

    watch(callState, (newVal) => {
      if (newVal === AICallState.Connected) {
        seconds.value = 0
        startTime = Date.now()
        durationTimer = window.setInterval(() => {
          seconds.value = Math.floor((Date.now() - startTime) / 1000)
        }, 1000)
      }
      else {
        if (durationTimer !== null) {
          clearInterval(durationTimer)
          durationTimer = null
        }
      }
    })

    const tipText = computed(() => {
      if (agentState.value === AICallAgentState.Listening) {
        if (!hasSpeaked.value) {
          return '请开始说话'
        }
        return '你说，我在听...'
      }

      if (agentState.value === AICallAgentState.Thinking) {
        return '思考中...'
      }

      if (agentState.value === AICallAgentState.Speaking) {
        if (enableVoiceInterrupt.value) {
          return '我正在回复中，可以轻触屏幕或说话打断我'
        }
        else {
          return '我正在回复中，可以轻触屏幕打断我'
        }
      }

      return ''
    })

    const durationText = computed(() => {
      const hours = Math.floor(seconds.value / 3600)
      const minutes = Math.floor((seconds.value % 3600) / 60)
      const remainingSeconds = seconds.value % 60

      return `${hours > 0 ? `${(hours < 10 ? '0' : '') + hours}:` : ''}${minutes < 10 ? '0' : ''}${minutes}:${
        remainingSeconds < 10 ? '0' : ''
      }${remainingSeconds}`
    })

    onMounted(() => {
      if (callState.value === AICallState.Connected) {
        seconds.value = 0
        startTime = Date.now()
        durationTimer = window.setInterval(() => {
          seconds.value = Math.floor((Date.now() - startTime) / 1000)
        }, 1000)
      }
    })

    onUnmounted(() => {
      if (durationTimer !== null) {
        clearInterval(durationTimer)
        durationTimer = null
      }
    })

    return {
      seconds,
      hasSpeaked,
      callState,
      agentState,
      tipText,
      durationText,
      AICallState,
      AICallAgentState,
    }
  },
})
</script>

<template>
  <div v-if="text" class="tip">
    {{ text }}
  </div>
  <div v-else class="tip">
    <div class="_time">
      {{ callState === AICallState.Connected ? durationText : ' ' }}
    </div>
    <div class="_text">
      {{ tipText }}
    </div>
  </div>
</template>

<style lang="scss">
.tip {
  position: relative;
  z-index: 3;
  margin: 16px 0;
  font-size: 12px;
  line-height: 20px;
  text-align: center;

  ._time {
    height: 20px;
    color: #aaacc4;
  }

  ._text {
    font-weight: 500;
    color: #624aff;
  }
}
</style>
