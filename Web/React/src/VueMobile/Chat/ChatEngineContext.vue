<script lang="ts">
  import { defineComponent, provide, h } from 'vue';
  import { AIChatEngine } from 'aliyun-auikit-aicall';

  export const ChatEngineContextKey = Symbol('ChatEngineContext');

  export default defineComponent({
    name: 'ChatEngineContextProvider',
    props: {
      value: {
        type: Object as () => AIChatEngine | null,
        required: true,
      },
    },
    setup(props, { slots }) {
      provide(ChatEngineContextKey, props.value);

      return () => h('div', slots.default ? slots.default() : []);
    },
  });
</script>
