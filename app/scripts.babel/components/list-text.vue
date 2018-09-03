<template>
  <li v-html="content , type"></li>
</template>

<script>
  export default {
    props: ['content', 'type']
  }
</script>

<style lang="css" scoped>
  li {
    margin-bottom: 5px;
  }

  li>>>.label {
    display: grid;
    font-weight: bold !important;
  }
</style>