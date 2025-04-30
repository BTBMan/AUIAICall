<template>
  <div class="connecting">
    <div
      class="_tip"
      :style="{
        opacity: isTipVisible ? 1 : 0,
        transform: `translateY(${isTipVisible ? 0 : -22}px)`,
        transition: 'opacity 0.3s, transform 0.3s',
      }"
    >
      点击拨打，开始进行语音交互
    </div>

    <ul v-if="callState === AICallState.Connecting" class="_loading">
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
    </ul>
  </div>
</template>

<script lang="ts">
  import { defineComponent, computed } from 'vue';
  import { useCallStore } from './store';
  import { AICallState } from 'aliyun-auikit-aicall';

  export default defineComponent({
    name: 'Connecting',
    setup() {
      const { status } = useCallStore();
      const callState = AICallState.Connecting; // 简化实现，实际应从 store 中获取

      const isTipVisible = computed(() => callState === AICallState.None);

      return {
        callState,
        isTipVisible,
        AICallState,
      };
    },
  });
</script>

<style lang="less">
  .connecting {
    flex: 1;
    text-align: center;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    ._tip {
      font-size: 14px;
      line-height: 22px;
      color: #26244c;
    }

    ._loading {
      list-style: none;
      padding: 0;
      margin: 10px 0 0;

      display: flex;

      li {
        margin: 0 4px;
        width: 4px;
        height: 5px;
        border-radius: 2px;
        background-color: #573dff;
        animation: connecting-loading 1s ease-in-out infinite;

        &:nth-child(1) {
          animation-delay: -0.4s;
        }
        &:nth-child(2) {
          animation-delay: -0.2s;
        }
        &:nth-child(3) {
          animation-delay: 0s;
        }
        &:nth-child(4) {
          animation-delay: 0.2s;
        }
        &:nth-child(5) {
          animation-delay: 0.4s;
        }
      }
    }
  }

  @keyframes connecting-loading {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
</style>
