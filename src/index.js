import ToolboxIcon from './svg/toolbox.svg';
import './index.css';
import Uploader from './uploader';

/**
 * Timeout when loader should be removed
 */
const LOADER_DELAY = 500;

/**
 * @typedef {object} PersonalityToolData
 * @description Personality Tool's input and output data format
 * @property {string} name — person's name
 * @property {string} description - person's description
 * @property {string} nameDescription - nameDescription to person's website
 * @property {string} photo - person's photo url
 * @property {string} label
 */

/**
 * @typedef {object} PersonalityConfig
 * @description Config supported by Tool
 * @property {string} endpoint - image file upload url
 * @property {string} field - field name for uploaded image
 * @property {string} types - available mime-types
 * @property {string} buttonLabel - label for add button
 * @property {object} additionalRequestData - any data to send with requests
 * @property {object} additionalRequestHeaders - allows to pass custom headers with Request
 * @property {string} namePlaceholder - placeholder for name field
 * @property {string} descriptionPlaceholder - placeholder for value field
 * @property {string} nameDescriptionPlaceholder - placeholder for value field
 * @property {string} title - placeholder for value field
 * @property {string} labelPlaceholder
 */

/**
 * @typedef {object} UploadResponseFormat
 * @description This format expected from backend on file uploading
 * @property {number} success - 1 for successful uploading, 0 for failure
 * @property {object} file - Object with file data.
 *                           'url' is required,
 *                           also can contain any additional data that will be saved and passed back
 * @property {string} file.url - [Required] image source URL
 */

/**
 * Personality Tool for the Editor.js
 */
export default class HistoryList {
  /**
   * @param {PersonalityToolData} data - Tool's data
   * @param {PersonalityConfig} config - Tool's config
   * @param {API} api - Editor.js API
   */
  constructor({ data, config, api }) {
    this.api = api;

    this.nodes = {
      wrapper: null,
      name: null,
      description: null,
      nameDescription: null,
      info: null,
      photo: null,
      label: null
    };

    this.config = {
      endpoint: config.endpoint || '',
      field: config.field || 'image',
      types: config.types || 'image/*',
      additionalRequestData: config.additionalRequestData || {},
      additionalRequestHeaders: config.additionalRequestHeaders || {},
      buttonLabel: config.buttonLabel || '+ Add',
      namePlaceholder: config.namePlaceholder || 'Name',
      nameDescriptionPlaceholder: config.nameDescriptionPlaceholder || 'nameDescription',
      descriptionPlaceholder: config.descriptionPlaceholder || 'Description',
      title: config.title || 'Personality',
      labelPlaceholder: config.labelPlaceholder || 'label'
    };

    /**
     * Set saved state
     */
    this.data = data;

    /**
     * Module for image files uploading
     */
    this.uploader = new Uploader({
      config: this.config,
      onUpload: (response) => this.onUpload(response),
      onError: (error) => this.uploadingFailed(error)
    });
  }

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   */
  static get toolbox() {
    return {
      icon: ToolboxIcon,
      title: 'History List'
    };
  }

  /**
   * File uploading callback
   * @param {UploadResponseFormat} response
   */
  onUpload(response) {
    const { body: { success, file } } = response;

    if (success && file && file.url) {
      this.data.photo = file;

      this.showFullImage();
    }
  }

  /**
   * On success: remove loader and show full image
   */
  showFullImage() {
    setTimeout(() => {
      this.nodes.photo.classList.remove(this.CSS.loader);
      this.nodes.photo.style.background = `url('${this.data.photo.url}') center center / contain no-repeat`;
    }, LOADER_DELAY);
  }

  /**
   * On fail: remove loader and reveal default image placeholder
   */
  stopLoading() {
    setTimeout(() => {
      this.nodes.photo.classList.remove(this.CSS.loader);
      this.nodes.photo.removeAttribute('style');
    }, LOADER_DELAY);
  }

  /**
   * Show loader when file upload started
   */
  addLoader() {
    this.nodes.photo.style.background = 'none';
    this.nodes.photo.classList.add(this.CSS.loader);
  }

  /**
   * If file uploading failed, remove loader and show notification
   * @param {string} errorMessage -  error message
   */
  uploadingFailed(errorMessage) {
    this.stopLoading();

    this.api.notifier.show({
      message: errorMessage,
      style: 'error'
    });
  }

  /**
   * Tool's CSS classes
   */
  get CSS() {
    return {
      baseClass: this.api.styles.block,
      input: this.api.styles.input,
      loader: this.api.styles.loader,

      /**
       * Tool's classes
       */
      wrapper: 'cdx-history',
      name: 'cdx-history__name',
      photo: 'cdx-history__photo',
      nameDescription: 'cdx-history__nameDescription',
      description: 'cdx-history__description',
      info: 'cdx-history__info',
      label: 'cdx-history__label'
    };
  }

  /**
   * Return Block data
   * @param {HTMLElement} toolsContent
   * @return {PersonalityToolData}
   */
  save(toolsContent) {
    const name = toolsContent.querySelector(`.${this.CSS.name}`).textContent;
    const description = toolsContent.querySelector(`.${this.CSS.description}`).textContent;
    const nameDescription = toolsContent.querySelector(`.${this.CSS.nameDescription}`).textContent;
    const photo = this.data.photo;
    const label = toolsContent.querySelector(`.${this.CSS.label}`).textContent;

    /**
     * Fill missing fields with empty strings
     */
    Object.assign(this.data, {
      name: name.trim() || '',
      nameDescription: nameDescription.trim() || '',
      label: label.trim() || '',
      description: description.trim() || '',
      photo: photo || ''
    });

    return this.data;
  }

  /**
   * Renders Block content
   * @return {HTMLDivElement}
   */
  render() {
    const { name, nameDescription, label, description, photo } = this.data;

    this.nodes.wrapper = this.make('div', this.CSS.wrapper);
    this.nodes.info = this.make('div', this.CSS.info);

    this.nodes.name = this.make('div', this.CSS.name, {
      contentEditable: true
    });

    this.nodes.label = this.make('div', this.CSS.label, {
      contentEditable: true
    });

    this.nodes.description = this.make('div', this.CSS.description, {
      contentEditable: true
    });

    this.nodes.nameDescription = this.make('div', this.CSS.nameDescription, {
      contentEditable: true
    });

    this.nodes.photo = this.make('div', this.CSS.photo);

    if (photo) {
      this.nodes.photo.style.background = `url('${photo.url}') center center / cover no-repeat`;
    }

    if (description) {
      this.nodes.description.textContent = description;
    } else {
      this.nodes.description.dataset.placeholder = this.config.descriptionPlaceholder;
    }

    if (name) {
      this.nodes.name.textContent = name;
    } else {
      this.nodes.name.dataset.placeholder = this.config.namePlaceholder;
    }

    if (nameDescription) {
      this.nodes.nameDescription.textContent = nameDescription;
    } else {
      this.nodes.nameDescription.dataset.placeholder = this.config.nameDescriptionPlaceholder;
    }

    if (label) {
      this.nodes.label.textContent = label;
    } else {
      this.nodes.label.dataset.placeholder = this.config.labelPlaceholder;
    }

    this.nodes.photo.addEventListener('click', () => {
      this.uploader.uploadSelectedFile({
        onPreview: () => {
          this.addLoader();
        }
      });
    });

    this.nodes.info.appendChild(this.nodes.name);
    this.nodes.info.appendChild(this.nodes.nameDescription);
    this.nodes.info.appendChild(this.nodes.label);
    this.nodes.info.appendChild(this.nodes.description);

    this.nodes.wrapper.appendChild(this.nodes.photo);
    this.nodes.wrapper.appendChild(this.nodes.info);

    return this.nodes.wrapper;
  }

  /**
   * Validate saved data
   * @param {PersonalityToolData} savedData - tool's data
   * @returns {boolean} - validation result
   */
  validate(savedData) {
    /**
     * Return false if fields are empty
     */
    return savedData.name.length && savedData.label.length;
  }

  /**
   * Helper method for elements creation
   * @param tagName
   * @param classNames
   * @param attributes
   * @return {HTMLElement}
   */
  make(tagName, classNames = null, attributes = {}) {
    const el = document.createElement(tagName);

    if (Array.isArray(classNames)) {
      el.classList.add(...classNames);
    } else if (classNames) {
      el.classList.add(classNames);
    }

    for (const attrName in attributes) {
      el[attrName] = attributes[attrName];
    }

    return el;
  }
}
