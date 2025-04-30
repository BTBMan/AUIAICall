<template>
  <div class="voice-tnt">
    <ul ref="listRef">
      <li v-for="n in 16" :key="n"></li>
    </ul>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, inject, onMounted, onUnmounted } from 'vue';
  import { AICallAgentState } from 'aliyun-auikit-aicall';
  import { useCallModel } from '../store';
  import { ControllerContextKey } from '../ControlerContext.vue';

  // 音量数组平均后转化为 0-32 范围
  function format(data: Uint8Array) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    let value = sum / data.length;
    if (value < 0) value = 0;
    if (value > 256) value = 256;

    // 使用对数压缩
    // 首先将输入标准化到 0 到 1 的范围
    const normalizedValue = value / 256;

    // 使用 Math.pow 进行指数缩放
    const exponent = 1.2;
    const compressed = Math.pow(normalizedValue, 1 / exponent);

    // 缩放到 0 到 32 的输出范围
    const output = compressed * 32;

    return Math.floor(output);
  }

  const FFTSize = 256;
  // 人声频率范围，从 1kHz 到 12kHz
  const VoiceStartRate = 1000;
  const VoiceEndRate = 12000;

  export default defineComponent({
    name: 'VoiceThinkingAndTalking',
    setup() {
      const controller = inject(ControllerContextKey);
      const listRef = ref<HTMLUListElement | null>(null);
      const { agentState } = useCallModel();
      const sourceNode = ref<MediaStreamAudioSourceNode | null>(null);
      let audioContext: AudioContext | null = null;
      let intervalId: number | null = null;

      const createAudioContext = () => {
        return new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      };

      onMounted(() => {
        audioContext = createAudioContext();

        const createSourceNode = (audioElement: HTMLAudioElement) => {
          const stream = audioElement.srcObject;
          if (!stream) return;
          sourceNode.value = audioContext!.createMediaStreamSource(
            stream as MediaStream,
          );
        };

        if (controller?.agentAudioElement) {
          createSourceNode(controller.agentAudioElement);
        } else {
          const onAudioElement = (audioElement?: HTMLAudioElement) => {
            if (audioElement) {
              createSourceNode(audioElement);
            }
          };
          controller?.on('AICallAgentAudioSubscribed', onAudioElement);
        }

        // 监听状态变化处理音频可视化
        let middleIndex = 5;

        // 当状态变化时设置适当的动画
        const setupAnimation = () => {
          clearAnimation();

          if (agentState.value === AICallAgentState.Thinking) {
            intervalId = window.setInterval(() => {
              for (let i = 0; i < 16; i++) {
                const li = listRef.value?.children[i] as HTMLLIElement;
                let height = 4;
                const delta = Math.abs(middleIndex - i);
                if (delta === 0) {
                  height = 32;
                } else if (delta === 1) {
                  height = 16;
                } else if (delta === 2) {
                  height = 8;
                }
                if (li) {
                  li.style.height = `${height}px`;
                }
              }
              middleIndex++;
              if (middleIndex > 12) {
                middleIndex = 5;
              }
            }, 200);
          } else if (agentState.value === AICallAgentState.Speaking) {
            if (!sourceNode.value || !audioContext) return;

            audioContext.resume();
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = FFTSize;
            const pcmData = new Uint8Array(analyser.frequencyBinCount);
            sourceNode.value.connect(analyser);
            analyser.connect(audioContext.createMediaStreamDestination());

            const startIndex = Math.floor(
              (analyser.frequencyBinCount * VoiceStartRate) /
                audioContext.sampleRate,
            );
            const count = Math.ceil(
              (analyser.frequencyBinCount * (VoiceEndRate - VoiceStartRate)) /
                audioContext.sampleRate /
                16,
            );

            intervalId = window.setInterval(() => {
              analyser?.getByteFrequencyData(pcmData);
              for (let i = 0; i < 16; i++) {
                const data = pcmData.slice(
                  startIndex + i * count,
                  startIndex + (i + 1) * count,
                );
                const li = listRef.value?.children[i] as HTMLLIElement;
                if (li) {
                  li.style.height = `${4 + format(data)}px`;
                }
              }
            }, 100);
          }
        };

        const clearAnimation = () => {
          if (intervalId) {
            window.clearInterval(intervalId);
            intervalId = null;
          }

          // 重置所有条的高度
          for (let i = 0; i < 16; i++) {
            const li = listRef.value?.children[i] as HTMLLIElement;
            if (li) {
              li.style.height = '4px';
            }
          }
        };

        // 监听agentState变化
        const unwatch = watch(() => agentState.value, setupAnimation, {
          immediate: true,
        });

        onUnmounted(() => {
          clearAnimation();
          unwatch();
          sourceNode.value?.disconnect();
          controller?.off('AICallAgentAudioSubscribed');
          audioContext?.close();
        });
      });

      return {
        listRef,
      };
    },
  });
</script>

<style lang="less">
  .voice-tnt {
    position: absolute;
    top: 0;
    left: 5px;
    width: 186px;
    height: 36px;
    background: linear-gradient(270deg, #71baff 4%, #7347ff 27%, #71baff 100%);

    ul {
      display: flex;
      width: 186px;
      height: 36px;
      align-items: center;
      list-style: none;
      margin: 0;
      padding: 0;
      background-color: white;
      mix-blend-mode: screen;
    }
    li {
      width: 6px;
      height: 4px;
      background: black;
      border-radius: 3px;
      margin: 0 3px;
      transition: height 0.2s ease-in-out;
    }
  }
</style>
