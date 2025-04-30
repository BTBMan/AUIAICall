<template>
  <div class="aicall-text-render" v-if="text">
    <template v-for="(line, index) in formattedText" :key="index">
      {{ line }}
      <br />
    </template>
  </div>
</template>

<script lang="ts">
  import { defineComponent, PropType, computed } from 'vue';

  export default defineComponent({
    name: 'TextLineRender',
    props: {
      text: {
        type: String as PropType<string>,
        default: '',
      },
    },
    setup(props) {
      const formattedText = computed(() => {
        if (!props.text) return [];
        return props.text.split('\n');
      });

      return {
        formattedText,
      };
    },
  });
</script>

<style>
  .aicall-text-render {
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
