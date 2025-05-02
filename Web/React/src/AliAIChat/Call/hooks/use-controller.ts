import type AUIAICallStandardController from '../../controller/call/AUIAICallStandardController'
import { ControllerContextKey } from '../provider'

export function useController() {
  const controller = inject<AUIAICallStandardController>(ControllerContextKey)

  return {
    controller,
    controllerRef: toRef(controller),
  }
}
