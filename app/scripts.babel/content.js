/*jslint node: true */
/*jshint undef:false */
const ROOT_ID = 'app_extension';
const FORM_ID = `${ROOT_ID}_form`;

// URL var ants.
const EXTERN_LINK_TEMPLATE = 'http://en.wikipedia.org/wiki/';
const GOOGLE_LINK_TEMPLATE = 'http://www.google.com/search?q=';
const EXTERNAL_ICON_URL = chrome.runtime.getURL('images/app/external.png');

// Internal global vars.
const body = document.getElementsByTagName('body')[0];

// Iframe width settings
const frameWidth = 600;
const frameHeight = 'auto';


/**
 * Main initialization function. Loads options and sets listeners.
 */
function initialize() {
  // Set event listeners.
  window.addEventListener('click', handleClick, false);
}


/**
 * Handle double click on words
 * @param  {} e
 */
function handleClick(e) {
  const key = e.keyCode; // keyCode detection
  const alt = e.altKey ? e.altKey : ((key === 17) ? true : false); // alt detection

  if (!event.target.closest(ROOT_ID)) {
    removePopup();
  }

  const QUERY = getTrimmedSelection(); // If the modifier is held down and we have a selection, create a pop-up.

  if (QUERY === null || QUERY === undefined || QUERY === '') {
    return false;
  }

  if (QUERY !== '' && alt) {
    e.preventDefault();
    createPopup(QUERY, e.pageX, e.pageY, e.clientX, e.clientY);
    getSelection().removeAllRanges();
  }
}


/**
 * Create and fade in the dictionary popup frame and button.
 * @param  {} query
 * @param  {} x
 * @param  {} y
 * @param  {} windowX
 * @param  {} windowY
 */
function createPopup(query, x, y, windowX, windowY) {

  const FRAME_REFFERENCE = document.getElementById(ROOT_ID);

  if (FRAME_REFFERENCE) { // If an old frame still exists, wait until it is killed.
    removePopup(); // Remove the old one.
    createPopup(query, x, y, windowX, windowY);
    return;
  }

  // Create the frame, set its id and insert it.
  const FRAME = document.createElement('div');

  FRAME.id = ROOT_ID;
  // Unique class to differentiate between frame instances.
  FRAME.className = ROOT_ID + new Date().getTime();
  body.appendChild(FRAME);

  // Start loading frame data.
  chrome.runtime.sendMessage({
      arg: query
    },
    response => {
      if (response !== null || response !== '') {
        const WRAPPER = document.createElement('div');
        WRAPPER.innerHTML = createHtmlFromLookup(query, response);
        for (let i = 0; i < WRAPPER.childNodes.length; i++) {
          FRAME.appendChild(WRAPPER.childNodes[i]);
        }
      }
    }
  );

  // Calculate frame position.
  const window_width = window.innerWidth;
  const window_height = window.innerHeight;
  const full_frame_width = frameWidth;
  const full_frame_height = frameHeight;
  let top = 0;
  let left = 0;
  const zoomRatio = getZoomRatio();

  if (windowX + full_frame_width * zoomRatio >= window_width) {
    left = x / zoomRatio - full_frame_width;
    if (left < 0) {
      left = 5;
    }
  } else {
    left = x / zoomRatio;
  }

  if (windowY + full_frame_height * zoomRatio >= window_height) {
    top = y / zoomRatio - full_frame_height;
    if (top < 0) {
      top = 5;
    }
  } else {
    top = y / zoomRatio;
  }

  // Set frame style.
  FRAME.style.left = `${left}px`;
  FRAME.style.top = `${top}px`;
  FRAME.style.width = `${frameWidth}px`;
  FRAME.style.height = `${frameHeight}px`;

}

/**
 *  Fade out then destroy the frame and/or form.
 * @param  {} do_frame
 * @param  {} do_form
 */
function removePopup() {
  const form = document.getElementById(FORM_ID);

  if (form) {
    body.removeChild(form);
  }

  // Remember the current frame's unique class name.
  const FRAME_REFFERENCE = document.getElementById(ROOT_ID);
  const FRAME_CLASS = FRAME_REFFERENCE ? FRAME_REFFERENCE.className : null;

  if (FRAME_REFFERENCE) {

    const FRAME_REFFERENCE = document.getElementById(ROOT_ID);
    // Check if the currently displayed frame is still the same as the old one.
    if (FRAME_REFFERENCE && FRAME_REFFERENCE.className === FRAME_CLASS) {
      body.removeChild(FRAME_REFFERENCE);
    }

  }
}

/**
 * @param  {} text
 */
function stripLinks(text) {
  return text.replace(/<a[^>]*>([^<>]*)<\/a>/g, '$1');
}


/**
 * @param  {} dict_entry
 */
function renderSuggestions(dict_entry) {
  let injectedHTML =
    `
  <div class='app_extension_parent'>
    <div class='app_extension_child'>
      No definitions for <strong>${query}</strong>.
  `;

  if (dict_entry.suggestions) {
    // Offer suggestions.

    injectedHTML += `

    <em class="suggestion">
      Did you mean`;

    for (var i = 0; i < dict_entry.suggestions.length; i++) {

      var extern_link = `${EXTERN_LINK_TEMPLATE}${dict_entry.suggestions[i]}`;
      injectedHTML += `<a href="${extern_link}" target="_blank">${dict_entry.suggestions[i]}</a>`;
      if (i === dict_entry.suggestions.length - 1) {
        injectedHTML += '?';
      } else if (i === dict_entry.suggestions.length - 2) {
        injectedHTML += ' or ';
      } else {
        injectedHTML += ', ';
      }
    }
    injectedHTML += '</em>';
  }

  // Suggest other sources.
  injectedHTML +=
    `
      <br/><br/>
      Try the same query in
      <a class="alternate_source" href="${GOOGLE_LINK_TEMPLATE}${query}" target="_blank">
        Google
      </a>
    </div>
  </div>
  `;
  return injectedHTML;
}

/**
 * @param  {} dict_entry
 */
function renderPronunciation(dict_entry) {

  // Header with formatted query and pronunciation.
  let injectedHTML = `<div class="${ROOT_ID}_header">`;
  var extern_link = `${EXTERN_LINK_TEMPLATE}${ dict_entry.term || query}`;
  injectedHTML += `<a class="${ROOT_ID}_title" href="${extern_link}" target="_blank">${dict_entry.term || query}</a>`

  if (dict_entry.ipa && dict_entry.ipa.length) {
    for (var i in dict_entry.ipa) {
      injectedHTML += `<span class="${ROOT_ID}_phonetic" title ="Phonetic"> ${dict_entry.ipa[i]}</span>`;
    }
  }

  injectedHTML += '</div>';
  // Meanings.
  injectedHTML += `<ul id="${ROOT_ID}_meanings">`;
  for (var i in dict_entry.meanings) {
    const meaning = dict_entry.meanings[i];
    injectedHTML += '<li>';
    meaning.content = stripLinks(meaning.content);
    injectedHTML += meaning.content;

    injectedHTML +=
      `<span class="${ROOT_ID}_pos">${meaning.type}</span>`;

    injectedHTML += '</li>';
  }
  injectedHTML += '</ul>';

  // Synonyms
  if (dict_entry.synonyms && dict_entry.synonyms.length) {
    injectedHTML += `
      <hr class="${ROOT_ID}_separator " />
        <div class="${ROOT_ID}_subtitle">Synonyms</div>`;

    injectedHTML += `<p id="${ROOT_ID}_synonyms">`;
    for (var i in dict_entry.synonyms) {
      var extern_link = `${EXTERN_LINK_TEMPLATE}${dict_entry.synonyms[i]}`;
      injectedHTML += `<a href="${extern_link}" target="_blank">${dict_entry.synonyms[i]}</a>`;
      if (i < dict_entry.synonyms.length - 1) {
        injectedHTML += ', ';
      }
    }
    injectedHTML += '</p>';
  }



  // Related
  if (dict_entry.related && dict_entry.related.length) {
    injectedHTML += `<hr class="${ROOT_ID}_separator" />
      <div class="${ROOT_ID}_subtitle">See also</div>`;

    injectedHTML += `<p id="${ROOT_ID}_related">`;
    for (var i in dict_entry.related) {
      var extern_link = `${EXTERN_LINK_TEMPLATE}${dict_entry.related[i]}`;
      injectedHTML += `<a href="${extern_link}">${dict_entry.related[i]}</a>`;
      if (i < dict_entry.related.length - 1) {
        injectedHTML += ', ';
      }
    }
    injectedHTML += '</p>';
  }

  return injectedHTML;
}

/**
 * @param  {} query
 * @param  {} dict_entry
 */
function createHtmlFromLookup(query, dict_entry) {

  let injectedHTML = '';

  injectedHTML += `<div id="${ROOT_ID}_content">`;

  if (!dict_entry.meanings || dict_entry.meanings.length === 0) {

    injectedHTML += renderSuggestions(dict_entry); // Render suggestions

  } else {

    injectedHTML += renderPronunciation(dict_entry); // Render suggestions
  }

  injectedHTML += `<div id="${ROOT_ID}_spacer"></div>`;
  injectedHTML += '</div>';

  return injectedHTML;
}

// Returns a trimmed version of the currently selected text.
function getTrimmedSelection() {
  const selection = String(window.getSelection());
  return selection.replace(/^\s+|\s+$/g, '');
}


/**
 * Returns the document body's zoom ratio.
 */
function getZoomRatio() {
  return document.documentElement.clientWidth / window.innerWidth;
}


initialize();