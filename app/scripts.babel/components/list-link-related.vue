<template>
  <li>
    <a >{{ title }}</a>,
  </li>
</template>

<script>
  export default {
    props: ['title', 'link'],
  }
</script>

<style scoped>
  .define {
    padding-bottom: 15px;
    border-bottom: 1px solid slategray;
  }

  .define ul li {
    float: left;
    margin-right: 5px;
  }

  .define ul li a {
    text-decoration: none;
    color: #6772e5;
    cursor: pointer;
  }

  .define ul li a:hover {
    textension-decoration: underline;
    color: #32325d;
  }
</style>