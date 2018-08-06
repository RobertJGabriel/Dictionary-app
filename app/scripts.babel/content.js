/*jslint node: true */
/*jshint undef:false */
/*global localStorage: false, const: false, Storage: false,navigator: false, XMLHttpRequest: false, chrome: false, console: false, $: false */
const ROOT_ID = 'app_extension';
const FORM_ID = `${ROOT_ID}_form`;

// URL var ants.
const EXTERN_LINK_TEMPLATE = 'http://en.wikipedia.org/wiki/%query%';
const AUDIO_LINK_TEMPLATE = 'http://en.wikipedia.org/wiki/File:%file%';
const GOOGLE_LINK_TEMPLATE = 'http://www.google.com/search?q=%query%&tbs=dfn:1';
const SPEAKER_ICON_URL = chrome.runtime.getURL('images/app/speaker.png');
const EXTERNAL_ICON_URL = chrome.runtime.getURL('images/app/external.png');

// Internal global vars.
const body = document.getElementsByTagName('body')[0];
// Extension options with defaults.
const options = {
  clickModifier: 'Alt',
  shortcutModifier: 'Alt',
  frameWidth: 550,
  frameHeight: 'auto',
  queryFormWidth: 250,
  queryFormHeight: 50, // This one is an approximation for centering.
};


/**
 * Main initialization function. Loads options and sets listeners.
 */
function initialize() {
  // Set event listeners.
  setTimeout(() => {
    window.addEventListener('click', handleClick, false);
  }, 500);
}


/**
 * Handle double click on words
 * @param  {} e
 */
function handleClick(e) {
  const key = e.keyCode; // keyCode detection
  const alt = e.altKey ? e.altKey : ((key === 17) ? true : false); // alt detection

  if (!event.target.closest(ROOT_ID)) {
    removePopup(true, true);
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
    removePopup(true, false); // Remove the old one.
    setTimeout(() => {
      createPopup(query, x, y, windowX, windowY);
    }, 100);
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
      method: 'lookup',
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
  const full_frame_width = options.frameWidth;
  const full_frame_height = options.frameHeight;
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
  FRAME.style.width = `${options.frameWidth}px`;
  FRAME.style.height = `${options.frameHeight}px`;

}


/**
 * Get the audio button
 * @param  {} url
 * @param  {} src_element
 */
function playAudio(url, src_element) {
  new Audio(url).addEventListener('canplaythrough', function () {
    this.play();
  });
}


/**
 * registerAudioIcon
 * @param  {} icon
 * @param  {} filename
 */
function registerAudioIcon(icon, filename) {

  icon.addEventListener('click', function (e) {
    const src_element = this;
    chrome.runtime.sendMessage({
        method: 'audio',
        arg: filename
      },
      url => {
        playAudio(url, src_element);
      }
    );
  });
}


/**
 *  Fade out then destroy the frame and/or form.
 * @param  {} do_frame
 * @param  {} do_form
 */
function removePopup(do_frame, do_form) {
  const form = document.getElementById(FORM_ID);

  if (form && do_form) {
    body.removeChild(form);
  }

  // Remember the current frame's unique class name.
  const FRAME_REFFERENCE = document.getElementById(ROOT_ID);
  const FRAME_CLASS = FRAME_REFFERENCE ? FRAME_REFFERENCE.className : null;

  if (FRAME_REFFERENCE && do_frame) {
    setTimeout(() => {
      const FRAME_REFFERENCE = document.getElementById(ROOT_ID);
      // Check if the currently displayed frame is still the same as the old one.
      if (FRAME_REFFERENCE && FRAME_REFFERENCE.className === FRAME_CLASS) {
        body.removeChild(FRAME_REFFERENCE);
      }
    }, 400);
  }
}

/**
 * @param  {} text
 */
function stripLinks(text) {
  return text.replace(/<a[^>]*>([^<>]*)<\/a>/g, '$1');
}



/**
 * @param  {} query
 * @param  {} dict_entry
 */
function createHtmlFromLookup(query, dict_entry) {

  const BUFFER = [];


  BUFFER.push(`<div id="${ROOT_ID}_content">`);

  if (!dict_entry.meanings || dict_entry.meanings.length === 0) {


    BUFFER.push(
      `
      <div class='app_extension_parent'>
        <div class='app_extension_child'>
      `
    );

    BUFFER.push(`No definitions for <strong>${query}</strong>.`);
    if (dict_entry.suggestions) {
      // Offer suggestions.
      BUFFER.push('<br /><br />');
      BUFFER.push('<em class="suggestion">');
      BUFFER.push('Did you mean ');
      for (var i = 0; i < dict_entry.suggestions.length; i++) {
        var extern_link = EXTERN_LINK_TEMPLATE.replace(
          '%query%',
          dict_entry.suggestions[i]
        );
        BUFFER.push(
          `<a href="${extern_link}" target="_blank">${dict_entry.suggestions[i]}</a>`
        );
        if (i === dict_entry.suggestions.length - 1) {
          BUFFER.push('?');
        } else if (i === dict_entry.suggestions.length - 2) {
          BUFFER.push(' or ');
        } else {
          BUFFER.push(', ');
        }
      }
      BUFFER.push('</em>');
    }

    // Suggest other sources.
    BUFFER.push(
      `
          <br/><br/>
          Try the same query in
          <a class="alternate_source" href="${GOOGLE_LINK_TEMPLATE.replace('%query%', query)}" target="_blank">
            Google
          </a>
        </div>
      </div>
      `
    );


  } else {
    // Header with formatted query and pronunciation.
    BUFFER.push(`<div class="${ROOT_ID}_header">`);
    var extern_link = EXTERN_LINK_TEMPLATE.replace('%query%', dict_entry.term || query);
    BUFFER.push(
      `<a class="${ROOT_ID}_title" href="${extern_link}" target="_blank">${dict_entry.term || query}</a>`
    );

    if (dict_entry.ipa && dict_entry.ipa.length) {
      for (var i in dict_entry.ipa) {
        BUFFER.push(`<span class="${ROOT_ID}_phonetic" title ="Phonetic"> ${dict_entry.ipa[i]}</span>`);
      }
    }

    if (dict_entry.audio && dict_entry.audio.length) {
      for (var i in dict_entry.audio) {
        const audio = dict_entry.audio[i];
        BUFFER.push(`
        <span class="${ROOT_ID}_audio" data-src="${audio.file}">
          <img class="${ROOT_ID}_speaker" src=${SPEAKER_ICON_URL} title=" Listen"/>
          (${audio.type})
        </span>
        `);

      }
    }

    BUFFER.push('</div>');

    // Meanings.
    BUFFER.push(`<ul id="${ROOT_ID}_meanings">`);
    for (var i in dict_entry.meanings) {
      const meaning = dict_entry.meanings[i];
      BUFFER.push('<li>');
      meaning.content = stripLinks(meaning.content);
      BUFFER.push(meaning.content);

      BUFFER.push(
        `<span class="${ROOT_ID}_pos">${meaning.type}</span>`
      );

      BUFFER.push('</li>');
    }
    BUFFER.push('</ul>');

    // Synonyms
    if (dict_entry.synonyms && dict_entry.synonyms.length) {
      BUFFER.push(`<hr class="${ROOT_ID}_separator " />`);
      BUFFER.push(`<div class="${ROOT_ID}_subtitle">Synonyms</div>`);

      BUFFER.push(`<p id="${ROOT_ID}_synonyms">`);
      for (var i in dict_entry.synonyms) {
        var extern_link = EXTERN_LINK_TEMPLATE.replace(
          '%query%',
          dict_entry.synonyms[i]
        );
        BUFFER.push(
          `<a href="${extern_link}" target="_blank">${dict_entry.synonyms[i]}</a>`
        );
        if (i < dict_entry.synonyms.length - 1) {
          BUFFER.push(', ');
        }
      }
      BUFFER.push('</p>');
    }



    // Related
    if (dict_entry.related && dict_entry.related.length) {
      BUFFER.push(`<hr class="${ROOT_ID}_separator" />`);
      BUFFER.push(`<div class="${ROOT_ID}_subtitle">See also</div>`);

      BUFFER.push(`<p id="${ROOT_ID}_related">`);
      for (var i in dict_entry.related) {
        var extern_link = EXTERN_LINK_TEMPLATE.replace(
          '%query%',
          dict_entry.related[i]
        );
        BUFFER.push(`<a href="${extern_link}">${dict_entry.related[i]}</a>`);
        if (i < dict_entry.related.length - 1) {
          BUFFER.push(', ');
        }
      }
      BUFFER.push('</p>');
    }
  }

  BUFFER.push(`<div id="${ROOT_ID}_spacer"></div>`);
  BUFFER.push('</div>');

  return BUFFER.join('');
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
  ratio = document.width / window.innerWidth;
}


initialize();