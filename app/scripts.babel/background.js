/**
 * Helper to send api requests
 * @param  {} url
 * @param  {} sendResponse
 */
function sendRequest(url, sendResponse) {
  const promiseObj = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.send();
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const resp = xhr.responseText;
          const respJson = JSON.parse(resp);
          resolve(respJson);
        } else {
          reject(xhr.status);
         // console.log('xhr failed');
        }
      } else {
       // console.log('xhr processing going on');
      }
    }
    //console.log('request sent succesfully');
  });
  return promiseObj;
}


/**
 * Server procedure for content script.
 * Receives a request containing two parameters:
 * method:
 *    'lookup' for a Dictionary lookup.
 * @param  {} request
 * @param  {} sender
 * @param  {} sendResponse
 */
chrome.extension.onMessage.addListener((request, sender, sendResponse) => {
  const method = request.method;
  // Look up a term from the dictionary using the Ajax API.
  const lookupURL = `http://dictionary-lookup.org/${request.arg}`;
  sendRequest(lookupURL)
    .then(resp => {
      sendResponse(resp || '{}');
    })
    .catch(error => {
      sendResponse('{}');
    });
  return true; // Inform Chrome that we will make a delayed sendResponse
});