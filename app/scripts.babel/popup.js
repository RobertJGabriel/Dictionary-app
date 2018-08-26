'use strict'

var vm = new Vue({
  el: '#app',
  data: {
    meanings: [],
    errorMessage: '',
    search: '',
    loading: true,
    paid: true,
    error: true,


    term: '',
    synonyms: [],
    related: [],
    ipa: [],
    etymology: []
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
          if (response !== null || response !== '') {
            console.log(response);
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
                console.log(this.related);
              }
            }

            if (response.etymology) {

              this.etymology = response.etymology;

            }

            this.related = response.related ? response.related : '';
            this.synonyms = response.synonyms ? response.synonyms : '';
            this.ipa = response.ipa ? response.ipa : '';
            
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