import Vue from 'vue';
import listLink from './components/list-link.vue';
import listText from './components/list-text.vue';
import externalLink from './components/external-link.vue';
import realtedLink from './components/list-link-related.vue';


Vue.component('vue-list-text', listText);
Vue.component('vue-list-link', listLink);
Vue.component('vue-external-link', externalLink);
Vue.component('vue-link-related',realtedLink);

new Vue({
  el: '#app',
  components: {
    listLink,
    listText,
    externalLink
  },
  data: {
    search: '',
    isEmpty: null,
    synonyms: [],
    related: [],
    meanings: [],
  },

  methods: {
    stripLinks(text) {
      return text.replace(/<a[^>]*>([^<>]*)<\/a>/g, '$1');
    },
    sortData(response) {

      this.search = response.term ? response.term : ''; // Set the search term

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
          var extern_link = `http://en.wikipedia.org/wiki/${response.related[i].toLowerCase()}`;
          let newObject = {
            link: extern_link,
            title: response.related[i],
          }
          this.related.push(newObject);
        }
      }


      if (response.synonyms) { // If there is synonyms terms in the response.
        for (var i in response.synonyms) {
          var extern_link = `http://en.wikipedia.org/wiki/${response.synonyms[i].toLowerCase()}`;
          let newObject = {
            link: extern_link,
            title: response.synonyms[i],
          }
          this.synonyms.push(newObject);
        }
      }
    },
    research(queryTerm){
      console.log(queryTerm);
      if (queryTerm !== null || queryTerm !== undefined || queryTerm !== '') {
        this.search = queryTerm;
        this.submit();
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

          if (this.isEmpty) return false;
          this.sortData(response);
        }
      );
    }
  }
});


// Set config settings
Vue.config.productionTip = true;
Vue.config.devtools = false;