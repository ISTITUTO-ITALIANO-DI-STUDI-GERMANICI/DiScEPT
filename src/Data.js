class Data {
  #changed = false;
  #project = {};
  #documents = {};

  static ERR_INVALID_TYPE = "invalid";
  static ERR_NO_DISCEPT = "no-discept";

  get project() {
    return this.#project;
  }

  set project(data) {
    this.#changed = true;
    this.#project = data;
  }

  get isChanged() {
    return this.#changed;
  }

  getDocumentLanguages() {
    return Object.keys(this.#documents);
  }

  getDocumentPerLanguage(language) {
    return this.#documents[language] || "";
  }

  addDocumentPerLanguage(language, body) {
    this.#documents[language] = body;
    this.#changed = true;
  }

  async addFileDocumentPerLanguage(language, file) {
    this.addDocumentPerLanguage(language, await file.text());
  }

  deleteDocumentPerLanguage(deletingLanguage) {
    delete this.#documents[deletingLanguage];
    this.#changed = true;
  }

  updateDocumentPerLanguage(language, value) {
    this.#documents[language] = value;
    this.#changed = true;
  }

  async readFromFile(file) {
    // TODO: extract the project details
    // TODO: extract the languages
    // TODO: return an error in case the format is incompatible.

   throw new Error(Data.ERR_NO_DISCEPT);

    this.#changed = false;
  }

  generateTEI() {
    return "TODO";
  }
};

const i = new Data();
export default i;
