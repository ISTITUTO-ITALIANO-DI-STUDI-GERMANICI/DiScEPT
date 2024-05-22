import React from 'react';

import Grid from "@mui/material/Grid";
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';

import Editor from "@monaco-editor/react";

import data from '../Data.js';

class Scrolling {
  run(id1, id2, prefix1, prefix2, highlightClass) {
    const e1 = document.getElementById(id1);
    const e2 = document.getElementById(id2);

    const elms = [...e1.querySelectorAll(`[id^=${prefix1}]`)].map(elm => ({
      elmA: elm,
      elmB: document.getElementById(`${prefix2}${elm.id.slice(prefix1.length)}`),
    }));

    this.#addSpanners(elms);
    this.#autoScrolling(e1, e2);
    this.#highlight(elms, highlightClass);
  }

  #addSpanners(elms) {
    elms.sort((a, b) => a.elmA.getBoundingClientRect().top > b.elmA.getBoundingClientRect().top).forEach(obj => {
      const posA = obj.elmA?.getBoundingClientRect().top;
      const posB = obj.elmB?.getBoundingClientRect().top;
      const diff = Math.abs(posA - posB);
      if (diff < 1) return;

      const spanner = document.createElement("div");
      spanner.setAttribute("style", `height: ${diff}px`);

      if (posA < posB) {
        obj.elmA?.parentNode.insertBefore(spanner, obj.elmA);
      } else {
        obj.elmB?.parentNode.insertBefore(spanner, obj.elmB);
      }
    });
  }

  #autoScrolling(e1, e2) {
    e1.addEventListener("scroll", e => {
      e2.scrollTop = e1.scrollTop;
    });

    e2.addEventListener("scroll", e => {
      e1.scrollTop = e2.scrollTop;
    });
  }

  #highlight(elms, highlightClass) {
    elms.forEach(obj => {
      obj.elmA?.addEventListener("mouseover", e => {
        obj.elmA?.classList.add(highlightClass);
        obj.elmB?.classList.add(highlightClass);
      });
      obj.elmB?.addEventListener("mouseover", e => {
        obj.elmA?.classList.add(highlightClass);
        obj.elmB?.classList.add(highlightClass);
      });
      obj.elmA?.addEventListener("mouseout", e => {
        obj.elmA?.classList.remove(highlightClass);
        obj.elmB?.classList.remove(highlightClass);
      });
      obj.elmB?.addEventListener("mouseout", e => {
        obj.elmA?.classList.remove(highlightClass);
        obj.elmB?.classList.remove(highlightClass);
      });
    });
  }
};

export default class EditorView extends React.Component {
  state = {
    a: 0,
    b: 0,
  };

  componentDidMount() { 
    document.getElementById('a').innerHTML = data.documents[this.state.a].body; 
    document.getElementById('b').innerHTML = data.documents[this.state.b].body; 

    this.#scroll();
  }

  #showDoc(where, index) {
    this.state[where] = index;
    this.setState(this.state);
    this.componentDidMount();
  }

  #scroll() {
    const formData = new FormData();
    formData.set('a', data.documents[this.state.a].body);
    formData.set('b', data.documents[this.state.b].body);

    fetch('http://localhost:3001/compare', {
      method: 'POST',
      body: formData,
    }).then(r => r.json(), err => {
      console.log("FETCH ERROR", err);
    }).then(body => {
      document.getElementById('a').innerHTML = body.a;
      document.getElementById('b').innerHTML = body.b;

      const i = new Scrolling();
      i.run("a", "b", "org_", "trans_", "highlight");
    }, err => {
      console.log("ERROR!", err);
    });

  }

  render() {
    return (
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel id="language-a-label">First TEI</InputLabel>
            <Select
              label="First TEI"
              labelId="language-a-label"
              id="language-a"
              value={this.state.a}
              onChange={event => this.#showDoc('a', event.target.value)}
    >
              {data.documents.map((doc, index) => (
                <MenuItem value={index} key={index}>{doc.language}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <div className="scrolling" id="a"></div>
        </Grid>

        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel id="language-b-label">Second TEI</InputLabel>
            <Select
              label="Second TEI"
              labelId="language-b-label"
              id="language-b"
              value={this.state.b}
              onChange={event => this.#showDoc('b', event.target.value)}
    >
              {data.documents.map((doc, index) => (
                <MenuItem value={index} key={index}>{doc.language}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <div className="scrolling" id="b"></div>
        </Grid>
      </Grid>
    );
  }
}
