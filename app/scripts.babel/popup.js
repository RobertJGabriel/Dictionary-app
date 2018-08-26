'use strict'

var vm = new Vue({
  el: '#app',
  data: {
    categories: [],
    errorMessage: '',
    search: '',
    loading: true,
    paid: true,
    error: true,

  },

  methods: {
    // Update Licence
    getZoomRatio: function () {
      return document.documentElement.clientWidth / window.innerWidth;
    },

    getTrimmedSelection: function () {
      const selection = String(window.getSelection());
      return selection.replace(/^\s+|\s+$/g, '');
    },
    stripLinks: function (text) {
      return text.replace(/<a[^>]*>([^<>]*)<\/a>/g, '$1');
    },

    load: function () {
      this.loading = true; // Trigger the loading module

    }
  }
})

vm.load()

// Set config settings
Vue.config.productionTip = false;
Vue.config.devtools = false;