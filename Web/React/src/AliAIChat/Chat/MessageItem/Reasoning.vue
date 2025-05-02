<script lang="ts">
  import { defineComponent, ref, computed } from 'vue';

  export default defineComponent({
    name: 'Reasoning',
    props: {
      message: {
        type: Object,
        required: true,
      },
    },
    setup(props) {
      const expanded = ref(false);

      const hasReasoning = computed(() => {
        return !!props.message.reasoningText;
      });

      const toggleExpand = () => {
        expanded.value = !expanded.value;
      };

      return {
        hasReasoning,
        expanded,
        toggleExpand,
      };
    },
  });
</script>

<template>
  <div v-if="hasReasoning" class="_reasoning">
    <div class="_reasoning-title">
      <span class="_reasoning-end-icon">🔍</span>
      <span>推理过程</span>
      <el-button
        class="_reasoning-expand-btn"
        :class="{ 'is-expanded': expanded }"
        @click="toggleExpand"
      >
        <span>▼</span>
      </el-button>
    </div>
    <div v-if="expanded" class="_reasoning-text">
      {{ message.reasoningText }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
  ._reasoning {
    margin: 8px 0;
  }

  ._reasoning-title {
    display: flex;
    line-height: 20px;
    color: #878aab;
    align-items: center;
    margin-bottom: 8px;
  }

  ._reasoning-text {
    font-size: 14px;
    color: #878aab;
    padding-left: 12px;
    border-left: 1px solid #878aab;
    word-wrap: break-word;
  }

  ._reasoning-end-icon {
    display: inline-block;
    height: 16px;
    margin-right: 8px;
    line-height: 16px;
  }

  ._reasoning-expand-btn {
    width: 20px;
    height: 20px;
    padding: 0;
    margin: 0 0 0 3px;
    cursor: pointer;
    background: none;
    border: none;
    color: #878aab;

    > span {
      height: 6px;
      line-height: 6px;
      font-size: 10px;
      display: inline-block;
      transition: 100ms linear;
    }

    &.is-expanded {
      > span {
        transform: rotate(180deg);
      }
    }
  }
</style>
