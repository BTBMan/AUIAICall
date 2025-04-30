<template>
  <div class="mobile-chat-state">{{ text }}</div>
</template>

<script lang="ts">
  import { defineComponent, computed } from 'vue';
  import { useChatModel } from './store';

  export default defineComponent({
    name: 'ChatState',
    setup() {
      const { aiState } = useChatModel();

      const text = computed(() => {
        if (!aiState.value) return '';
        return aiState.value;
      });

      return {
        text,
      };
    },
  });
</script>

<style>
  @import '../../Mobile/Chat/state.less';
</style>
