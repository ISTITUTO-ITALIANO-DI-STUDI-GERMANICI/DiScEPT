import * as React from "react";
import CETEIHelper from '../CETEIHelper.js';

export default class CETEIWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.contentRef = React.createRef();
  }

  componentDidMount() {
    this.contentRef.current.innerHTML = "";
    this.contentRef.current.append(CETEIHelper.CETEI.makeHTML5(this.props.tei));
  }

  render() {
    return  <div ref={this.contentRef} />
  }
}
