<template>
  <a :href="link" target="_blank">{{ text }}</a>
</template>

<script>
  export default {
    props: ['link', 'text']
  }
</script>
