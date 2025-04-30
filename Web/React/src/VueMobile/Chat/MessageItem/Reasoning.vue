<template>
  <div class="_reasoning" v-if="message?.reasoningText">
    <div class="_reasoning-title">
      <span class="_reasoning-end-icon" v-if="message.isReasoningEnd">
        <ReasoningEndSVG />
      </span>
      <span>{{ titleText }}</span>
      <van-button
        class="_reasoning-expand-btn"
        :class="{ 'is-expanded': expanded }"
        @click="toggleExpanded"
      >
        <ReasoningExpandSVG />
      </van-button>
    </div>
    <div class="_reasoning-text" v-if="expanded">
      <TextLineRender :text="message.reasoningText" />
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, PropType, ref, computed } from 'vue';
  import { AIChatMessage, AIChatMessageState } from 'aliyun-auikit-aicall';
  import TextLineRender from './TextLineRender.vue';
  import { ReasoningEndSVG, ReasoningExpandSVG } from '../Icons';

  export default defineComponent({
    name: 'MessageItemReasoning',
    components: {
      TextLineRender,
      ReasoningEndSVG,
      ReasoningExpandSVG,
    },
    props: {
      message: {
        type: Object as PropType<AIChatMessage>,
        required: true,
      },
    },
    setup(props) {
      const expanded = ref(true);

      const titleText = computed(() => {
        if (props.message.isReasoningEnd) {
          return '思考完成';
        } else if (
          props.message.messageState === AIChatMessageState.Interrupted
        ) {
          return '思考停止';
        }
        return '思考中';
      });

      const toggleExpanded = () => {
        expanded.value = !expanded.value;
      };

      return {
        expanded,
        titleText,
        toggleExpanded,
      };
    },
  });
</script>

<style>
  /* 使用React版本的样式 */
  /* 这个样式可能包含在index.less文件中 */
</style>
