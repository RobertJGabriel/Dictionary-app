'use strict'

var vm = new Vue({
  el: '#app',
  data: {
    search: '',
    loading: true,
    isEmpty: false,
    term: '',
    synonyms: [],
    related: [],
    ipa: [],
    meanings: [],
  },

  methods: {
    stripLinks: function (text) {
      return text.replace(/<a[^>]*>([^<>]*)<\/a>/g, '$1');
    },
    load: function () {
      this.loading = true; // Trigger the loading module
    },
    submit: function () {
      console.log(this.search);
      let query = this.search;
      // Start loading frame data.
      chrome.runtime.sendMessage({
          method: 'lookup',
          arg: query
        },
        response => {


          let isEmpty = Object.getOwnPropertyNames(response).length === 0
          this.isEmpty = isEmpty;

          this.synonyms = [];
          this.related = []
          this.meanings = [];
          this.ipa = [];

          if (response !== null || response !== '') {
            this.term = response.term ? response.term : '';
            if (response.meanings) {
              for (var i in response.meanings) {
                const meaning = response.meanings[i];
                let newObject = {
                  content: this.stripLinks(meaning.content),
                  type: meaning.type
                }
                this.meanings.push(newObject);
              }
            }


            if (response.related) {
              for (var i in response.related) {
                var extern_link = `http://en.wikipedia.org/wiki/${response.related[i]}`;
                let newObject = {
                  link: extern_link,
                  title: response.related[i],
                }
                this.related.push(newObject);
              }
            }

            if (response.ipa) {
              for (var i in response.ipa) {
                let newObject = {
                  title: response.ipa[i],
                }
                this.ipa.push(newObject);
              }
            }


            if (response.synonyms) {
              for (var i in response.synonyms) {
                var extern_link = `http://en.wikipedia.org/wiki/${response.synonyms[i]}`;
                let newObject = {
                  linke: extern_link,
                  title: response.synonyms[i],
                }
                this.synonyms.push(newObject);
              }
            }

          }
        }
      );
    }
  }
})

vm.load()

// Set config settings
Vue.config.productionTip = false;
Vue.config.devtools = false;