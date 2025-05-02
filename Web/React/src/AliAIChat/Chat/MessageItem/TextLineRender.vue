<script lang="ts">
  import { defineComponent } from 'vue';

  export default defineComponent({
    name: 'TextLineRender',
    props: {
      text: {
        type: String,
        default: '',
      },
    },
    setup(props) {
      return {};
    },
  });
</script>

<template>
  <div class="text-line-render">
    {{ text }}
  </div>
</template>

<style lang="scss" scoped>
  .text-line-render {
    word-break: break-all;
    white-space: pre-wrap;
  }
</style>
