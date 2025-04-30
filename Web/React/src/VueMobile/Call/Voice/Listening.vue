<template>
  <div class="voice-listening" ref="rootRef">
    <ul class="is-line-1">
      <li v-for="n in 15" :key="n"></li>
    </ul>
    <ul class="is-line-2">
      <li v-for="n in 15" :key="n"></li>
    </ul>
    <ul class="is-line-3">
      <li v-for="n in 15" :key="n"></li>
    </ul>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, inject, onMounted, onUnmounted } from 'vue';
  import { useCallModel } from '../store';
  import { ControllerContextKey } from '../ControlerContext.vue';

  export default defineComponent({
    name: 'VoiceListening',
    setup() {
      const { agentState } = useCallModel();
      const controller = inject(ControllerContextKey);
      const rootRef = ref<HTMLElement | null>(null);

      onMounted(() => {
        const onVolume = (uid: string, volume: number) => {
          if (uid === '') {
            rootRef.value?.style.setProperty('--strong', `${volume / 100}`);
          }
        };

        controller?.on('AICallActiveSpeakerVolumeChanged', onVolume);

        onUnmounted(() => {
          controller?.off('AICallActiveSpeakerVolumeChanged', onVolume);
        });
      });

      return {
        rootRef,
        agentState,
      };
    },
  });
</script>

<style lang="less">
  @keyframes dot-animation-3 {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(calc(var(--strong) * 1.5));
      transform: scale(1.5);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes dot-animation-4 {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(calc(var(--strong) * 2));
      transform: scale(2);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes dot-animation-5 {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(calc(var(--strong) * 2.5));
      transform: scale(2.5);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes dot-animation-6 {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(calc(var(--strong) * 3));
      transform: scale(3);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes dot-animation-7 {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(calc(var(--strong) * 3.5));
      transform: scale(3.5);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes dot-animation-8 {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(calc(var(--strong) * 4));
      transform: scale(4);
    }
    100% {
      transform: scale(1);
    }
  }

  .listeningDot(@min) {
    transform: scale((@min / 2));
  }

  .listeningDotLoop(@index) when (@index > 0) {
    li:nth-child(@{index}) {
      left: ((@index - 1) * 14 + 4px);
    }

    li:nth-child(@{index}) when (@index >8) {
      animation-delay: 0ms + ((@index - 8) * 50);
      transition-delay: 0ms + ((@index - 8) * 50);
    }
    li:nth-child(@{index}) when (@index <8) {
      animation-delay: 0ms + ((8 - @index) * 50);
      transition-delay: 0ms + ((8 - @index) * 50);
    }

    .listeningDotLoop(@index - 1);
  }

  .voice-listening {
    position: absolute;
    left: 0;
    top: 0;
    width: 198px;
    height: 36px;
    background: radial-gradient(35% 134% at 50% 50%, #7347ff 0%, #71baff 100%);
    --strong: 1;

    ul {
      position: relative;
      display: flex;
      height: 12px;
      width: 198px;
      flex: 1;
      align-items: center;
      list-style: none;
      margin: 0;
      padding: 0;
      background-color: white;
      mix-blend-mode: screen;
    }

    li {
      position: absolute;
      top: 5px;
      flex: 1;
      width: 2px;
      height: 2px;
      border-radius: 2px;
      transform-origin: center center;
      background-color: black;
    }

    .is-line-1,
    .is-line-3 {
      li {
        &:nth-child(4),
        &:nth-child(12) {
          // .listeningDot(3);
          // animation: dot-animation-3 1s infinite;
          transform: scale(calc(1 + var(--strong) * 0.5));
        }
        &:nth-child(5),
        &:nth-child(6),
        &:nth-child(10),
        &:nth-child(11) {
          // animation: dot-animation-4 1s infinite;
          transform: scale(calc(1 + var(--strong)));
        }
        &:nth-child(7),
        &:nth-child(9) {
          // animation: dot-animation-6 1s infinite;
          transform: scale(calc(1 + var(--strong) * 2));
        }
        &:nth-child(8) {
          // animation: dot-animation-8 1s infinite;
          transform: scale(calc(1 + var(--strong) * 3));
        }
      }
    }
    .is-line-2 {
      li {
        &:nth-child(2),
        &:nth-child(14) {
          // animation: dot-animation-3 1s infinite;
          transform: scale(calc(1 + var(--strong) * 0.5));
        }
        &:nth-child(3),
        &:nth-child(13) {
          // animation: dot-animation-4 1s infinite;
          transform: scale(calc(1 + var(--strong) * 1));
        }
        &:nth-child(4),
        &:nth-child(5),
        &:nth-child(11),
        &:nth-child(12) {
          // animation: dot-animation-5 1s infinite;
          transform: scale(calc(1 + var(--strong) * 1.5));
        }
        &:nth-child(6),
        &:nth-child(10) {
          // animation: dot-animation-6 1s infinite;
          transform: scale(calc(1 + var(--strong) * 2.5));
        }
        &:nth-child(7),
        &:nth-child(8),
        &:nth-child(9) {
          // animation: dot-animation-8 1s infinite;
          transform: scale(calc(1 + var(--strong) * 3));
        }
      }
    }

    .is-line-1,
    .is-line-2,
    .is-line-3 {
      .listeningDotLoop(15);
    }
  }
</style>
