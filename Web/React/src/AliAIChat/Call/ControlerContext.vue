<script lang="ts" setup>
import { provide } from 'vue'
import type AUIAICallController from '../controller/call/AUIAICallController'
import { ControllerContextKey } from './provider'

const props = defineProps<{
  value: AUIAICallController | null
}>()

provide(ControllerContextKey, reactive({ ...toRefs(props) }))
</script>

<template>
  <slot />
</template>
