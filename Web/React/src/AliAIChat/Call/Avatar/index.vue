<script lang="ts">
import { defineComponent, onMounted } from 'vue'
import { useCallStore } from '../store'
import { useController } from '../hooks/use-controller'

export default defineComponent({
  name: 'Avatar',
  setup() {
    const { controllerRef: controller } = useController()
    const { agentState } = storeToRefs(useCallStore())

    onMounted(() => {
      console.log('Avatar mounted, agentState:', agentState.value)
      // 这里可以添加任何3D模型的初始化逻辑
    })

    return {}
  },
})
</script>

<template>
  <div class="character avatar">
    <div class="_box">
      <div class="_model-container">
        <div class="_model" />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
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
