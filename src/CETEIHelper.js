class CETEIHelper {
  #CETEI;

  constructor() {
    this.#CETEI = new CETEI({
      ignoreFragmentId: true
    });
  }

  get CETEI() {
    return this.#CETEI;
  }
};

const i = new CETEIHelper();
export default i;
