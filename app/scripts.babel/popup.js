const vm = new Vue({
  el: '#app',
  data: {
    search: '',
    isEmpty: null,
    term: '',
    synonyms: [],
    related: [],
    ipa: [],
    meanings: [],
  },

  methods: {
    stripLinks(text) {
      return text.replace(/<a[^>]*>([^<>]*)<\/a>/g, '$1');
    },
    sortData(response) {

      this.term = response.term ? response.term : ''; // Set the search term

      if (response.meanings) { // If there is meanings in the response.
        for (var i in response.meanings) { // Loop though the array
          const meaning = response.meanings[i];
          let newObject = {
            content: this.stripLinks(meaning.content), // Stripe though the array
            type: meaning.type
          }
          this.meanings.push(newObject);
        }
      }


      if (response.related) { // If there is related terms in the response.
        for (var i in response.related) {
          var extern_link = `http://en.wikipedia.org/wiki/${response.related[i]}`;
          let newObject = {
            link: extern_link,
            title: response.related[i],
          }
          this.related.push(newObject);
        }
      }


      if (response.ipa) { // If there is ipa terms in the response.
        for (var i in response.ipa) {
          let newObject = {
            title: response.ipa[i],
          }
          this.ipa.push(newObject);
        }
      }


      if (response.synonyms) { // If there is synonyms terms in the response.
        for (var i in response.synonyms) {
          var extern_link = `http://en.wikipedia.org/wiki/${response.synonyms[i]}`;
          let newObject = {
            linke: extern_link,
            title: response.synonyms[i],
          }
          this.synonyms.push(newObject);
        }
      }
    },
    submit() {

      let query = this.search;

      if (query === null || query === undefined || query === '') {
        return false;
      }
      // Start loading frame data.
      chrome.runtime.sendMessage({
          arg: query
        },
        response => {

          this.isEmpty = Object.getOwnPropertyNames(response).length === 0 // Check if an empty response.

          this.synonyms = []; // Clear the varabiles
          this.related = []
          this.meanings = [];
          this.ipa = [];

          if (this.isEmpty) return false;
          this.sortData(response);
        }
      );
    }
  }
});


// Set config settings
Vue.config.productionTip = false;
Vue.config.devtools = false;