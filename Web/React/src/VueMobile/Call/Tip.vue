<template>
  <div class="tip" v-if="text">
    {{ text }}
  </div>
  <div class="tip" v-else>
    <div class="_time">
      {{ callState === AICallState.Connected ? durationText : ' ' }}
    </div>
    <div class="_text">{{ tipText }}</div>
  </div>
</template>

<script lang="ts">
  import {
    defineComponent,
    ref,
    computed,
    onMounted,
    onUnmounted,
    watch,
  } from 'vue';
  import i18n from '@/common/i18n';
  import { useCallStore } from './store';
  import { AICallState, AICallAgentState } from 'aliyun-auikit-aicall';

  export default defineComponent({
    name: 'CallTip',
    props: {
      text: {
        type: String,
        default: '',
      },
    },
    setup(props) {
      const seconds = ref(0);
      const hasSpeaked = ref(false);
      let durationTimer: number | null = null;
      let startTime = 0;

      // 简化实现，实际应从 store 中获取
      const callState = ref(AICallState.Connected);
      const agentState = ref(AICallAgentState.Listening);
      const isSpeaking = ref(false);
      const enableVoiceInterrupt = ref(true);

      watch(isSpeaking, (newVal) => {
        if (newVal) {
          hasSpeaked.value = true;
        }
      });

      watch(callState, (newVal) => {
        if (newVal === AICallState.Connected) {
          seconds.value = 0;
          startTime = Date.now();
          durationTimer = window.setInterval(() => {
            seconds.value = Math.floor((Date.now() - startTime) / 1000);
          }, 1000);
        } else {
          if (durationTimer !== null) {
            clearInterval(durationTimer);
            durationTimer = null;
          }
        }
      });

      const tipText = computed(() => {
        if (agentState.value === AICallAgentState.Listening) {
          if (!hasSpeaked.value) {
            return i18n['status.listeningToStart'];
          }
          return i18n['status.listening'];
        }

        if (agentState.value === AICallAgentState.Thinking) {
          return i18n['status.thinking'];
        }

        if (agentState.value === AICallAgentState.Speaking) {
          if (enableVoiceInterrupt.value) {
            return i18n['status.mobile.speaking'];
          } else {
            return i18n['status.mobile.speakingNoInterrupt'];
          }
        }

        return '';
      });

      const durationText = computed(() => {
        const hours = Math.floor(seconds.value / 3600);
        const minutes = Math.floor((seconds.value % 3600) / 60);
        const remainingSeconds = seconds.value % 60;

        return `${hours > 0 ? (hours < 10 ? '0' : '') + hours + ':' : ''}${minutes < 10 ? '0' : ''}${minutes}:${
          remainingSeconds < 10 ? '0' : ''
        }${remainingSeconds}`;
      });

      onMounted(() => {
        if (callState.value === AICallState.Connected) {
          seconds.value = 0;
          startTime = Date.now();
          durationTimer = window.setInterval(() => {
            seconds.value = Math.floor((Date.now() - startTime) / 1000);
          }, 1000);
        }
      });

      onUnmounted(() => {
        if (durationTimer !== null) {
          clearInterval(durationTimer);
          durationTimer = null;
        }
      });

      return {
        seconds,
        hasSpeaked,
        callState,
        agentState,
        tipText,
        durationText,
        AICallState,
        AICallAgentState,
      };
    },
  });
</script>

<style lang="less">
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
