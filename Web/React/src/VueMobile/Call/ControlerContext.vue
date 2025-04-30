<script lang="ts">
  import { defineComponent, provide, h } from 'vue';
  import { AICallController } from 'aliyun-auikit-aicall';

  export const ControllerContextKey = Symbol('ControllerContext');

  export default defineComponent({
    name: 'ControllerContextProvider',
    props: {
      value: {
        type: Object as () => AICallController | null,
        required: true,
      },
    },
    setup(props, { slots }) {
      provide(ControllerContextKey, props.value);

      return () => h('div', slots.default ? slots.default() : []);
    },
  });
</script>
