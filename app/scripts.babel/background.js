const DICT_API_URL = 'http://dictionary-lookup.org/%query%';
const AUDIO_API_URL = 'https://en.wikipedia.org/wiki/File:%file%';

/**
 * Helper to send an AJAX request.
 * @param  {} url
 * @param  {} callback
 */
function sendAjaxRequest(url, callback) {
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      callback(xhr.responseText);
    }
  };
  xhr.open('GET', url, true);
  xhr.send();
}


/**
 * Server procedure for content script.
 * Receives a request containing two parameters:
 * method:
 *    'lookup' for a Dictionary lookup.
 *    'audio' to look up the URL of a given Wikimedia audio file.
 * @param  {} request
 * @param  {} sender
 * @param  {} callback
 */
chrome.extension.onMessage.addListener((request, sender, callback) => {

  const method = request.method;

  if (method === 'lookup') {
    // Look up a term from the dictionary using the Ajax API.
    const lookupURL = DICT_API_URL.replace('%query%', request.arg);
    sendAjaxRequest(lookupURL, resp => {
      callback(JSON.parse(resp || '{}'));
    });
    return true; // Inform Chrome that we will make a delayed callback
  }

  if (method === 'audio') {
    // Look up the URL of a given wikipedia audio file.
    const audioURL = AUDIO_API_URL.replace('%file%', request.arg);
    sendAjaxRequest(audioURL, resp => {
      const url_match = resp.match(/<source src='([^']+)' type='audio/);
      if (url_match && url_match.length == 2) {
        callback(url_match[1]);
      } else {
        callback('');
      }
    });

    return true; // Inform Chrome that we will make a delayed callback
  }

  // Invalid request method. Ignore it.
  if(method !== 'audio' && method !== 'lookup'){
    callback('');
  }
});
