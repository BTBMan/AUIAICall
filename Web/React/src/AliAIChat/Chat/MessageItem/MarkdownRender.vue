<script lang="ts">
  import { defineComponent, onMounted, ref, watch } from 'vue';
  import MarkdownIt from 'markdown-it';
  import hljs from 'highlight.js';
  import 'highlight.js/styles/github.css';
  import wrapTable from './markdownPlugin/wrapTable';
  import addTargetToLinks from './markdownPlugin/addTargetToLinks';

  // 创建markdown-it实例并配置
  const md = new MarkdownIt({
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(str, { language: lang }).value;
        } catch (e) {
          console.error('Markdown highlight error:', e);
        }
      }
      return ''; // 使用默认的转义
    },
  });

  // 应用自定义插件
  md.use(wrapTable);
  md.use(addTargetToLinks);

  export default defineComponent({
    name: 'MarkdownRender',
    props: {
      text: {
        type: String,
        default: '',
      },
    },
    setup(props) {
      const htmlContent = ref('');

      const renderMarkdown = () => {
        if (!props.text) {
          htmlContent.value = '';
          return;
        }

        htmlContent.value = md.render(props.text);
      };

      // 首次挂载时渲染
      onMounted(() => {
        renderMarkdown();
        // 如果包含代码块，高亮所有代码
        if (props.text && props.text.includes('```')) {
          hljs.highlightAll();
        }
      });

      // 监听文本变化重新渲染
      watch(
        () => props.text,
        (newText) => {
          renderMarkdown();
          // 如果包含代码块，高亮所有代码
          if (newText && newText.includes('```')) {
            hljs.highlightAll();
          }
        },
      );

      return {
        htmlContent,
      };
    },
  });
</script>

<template>
  <div v-if="text" class="aicall-markdown-render" v-html="htmlContent"></div>
</template>

<style lang="scss">
  .aicall-markdown-render {
    word-break: break-all;
    white-space: pre-wrap;

    pre {
      background-color: rgba(0, 0, 0, 0.05);
      padding: 8px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 8px 0;
    }

    code {
      font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
    }

    ._table-container {
      overflow-x: auto;
      margin: 8px 0;
    }

    table {
      border-collapse: collapse;
      width: 100%;

      th,
      td {
        border: 1px solid #ddd;
        padding: 4px 8px;
        text-align: left;
      }

      th {
        background-color: rgba(0, 0, 0, 0.05);
      }
    }

    a {
      color: #624aff;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    p {
      margin: 8px 0;
    }

    img {
      max-width: 100%;
      margin: 8px 0;
      border-radius: 4px;
    }

    blockquote {
      margin: 8px 0;
      padding: 4px 12px;
      border-left: 4px solid #ddd;
      color: #666;
    }

    ul,
    ol {
      padding-left: 24px;
    }
  }
</style>
