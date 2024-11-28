// Import React and CETEIHelper, a custom helper for handling TEI XML transformations
import * as React from "react";
import CETEIHelper from "../CETEIHelper.js"; // Utility to convert TEI XML into HTML5

// CETEIWrapper Component - A React component that transforms and renders TEI XML content
export default class CETEIWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.contentRef = React.createRef(); // Reference to the DOM element where transformed TEI will be rendered
  }

  // Lifecycle method - Runs once after the component mounts
  componentDidMount() {
    // Clear any existing content within the referenced element
    this.contentRef.current.innerHTML = "";

    // Convert the TEI XML content passed via props into HTML5 using CETEIHelper and append it to contentRef
    this.contentRef.current.append(CETEIHelper.CETEI.makeHTML5(this.props.tei));
  }

  // Render method - Returns a div element that acts as a container for the transformed content
  render() {
    return <div ref={this.contentRef} />; // Ref is assigned to allow direct DOM manipulation
  }
}
