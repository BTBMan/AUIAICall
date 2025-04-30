<template>
  <div class="character avatar">
    <div class="_box">
      <div class="_model-container">
        <div class="_model"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, inject, onMounted, ref } from 'vue';
  import { useCallModel } from '../store';
  import { ControllerContextKey } from '../ControlerContext.vue';

  export default defineComponent({
    name: 'Avatar',
    setup() {
      const controller = inject(ControllerContextKey);
      const { agentState } = useCallModel();

      onMounted(() => {
        console.log('Avatar mounted, agentState:', agentState.value);
        // 这里可以添加任何3D模型的初始化逻辑
      });

      return {};
    },
  });
</script>

<style lang="less">
  .avatar {
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;

    video {
      position: absolute;
      min-height: 100%;
      width: 100%;
      background-color: #000;
      object-fit: contain;
      bottom: 0;
      opacity: 0.5;
      transition: opacity 0.5s ease-in-out;

      &.has-loaded {
        opacity: 1;
      }
    }
  }
</style>
