<template>
  <div class="aicall-markdown-render" v-html="renderedContent"></div>
</template>

<script lang="ts">
  import { defineComponent, PropType, ref, watch, onMounted } from 'vue';
  import markdownit from 'markdown-it';
  import hljs from 'highlight.js';
  import 'highlight.js/styles/github.css';
  import wrapTable from './markdownPlugin/wrapTable';
  import addTargetToLinks from './markdownPlugin/addTargetToLinks';

  const md = markdownit({
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(str, { language: lang }).value;
        } catch (__) {
          /** EMPTY */
        }
      }
      return ''; // use external default escaping
    },
  });

  md.use(wrapTable);
  md.use(addTargetToLinks);

  export default defineComponent({
    name: 'MessageItemMarkdownRender',
    props: {
      text: {
        type: String as PropType<string>,
        required: true,
      },
    },
    setup(props) {
      const renderedContent = ref('');

      const renderMarkdown = () => {
        if (!props.text) {
          renderedContent.value = '';
          return;
        }
        renderedContent.value = md.render(props.text);
      };

      // 当文本变化时重新渲染
      watch(
        () => props.text,
        () => {
          renderMarkdown();
          // 等待DOM更新完成后应用高亮
          setTimeout(() => {
            if (props.text.includes('```')) {
              hljs.highlightAll();
            }
          }, 0);
        },
        { immediate: true },
      );

      onMounted(() => {
        if (props.text.includes('```')) {
          hljs.highlightAll();
        }
      });

      return {
        renderedContent,
      };
    },
  });
</script>

<style>
  /* 从原始的less文件导入样式 */
  @import '../../../Mobile/Chat/MessageItem/markdownRender.less';
</style>
