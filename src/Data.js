const tei = (text,extra = null) => `
<TEI version="3.3.0" xmlns="http://www.tei-c.org/ns/1.0">
 <teiHeader>
  <fileDesc>
   <titleStmt>
    <title>${text}</title>
   </titleStmt>
   <publicationStmt>
    <p>${text}</p>
   </publicationStmt>
  </fileDesc>
 </teiHeader>
 <text>
  <body>
   ${extra || text}
  </body>
 </text>
</TEI>`;

class Data {
  project = {}

  documents = [
    { language: "German transcription", body: tei("Dies ist eine Transkription", `
<p>Umgekehrt zum Verlauf dieser kurzen Darstellung der Linie verläuft die darin
zugleich enthaltene Darstellung der Fläche. Als die Linie aktiv war, teilte sie
in imaginäre Flächen. Dazwischen drängte sich der Flächencharakter hervor und
wurde dann aktiv, als die Linie als passiv bezeichnet wurde. Die Fläche ist
rein gezüchtet, das ruhige Element.</p>

<p>Gerät sie aber in Bewegung, so nähert sie sich dem Liniencharakter.</p>

<p>Je weiter die Linie A—B sich fortbewegt, desto dünner wird die dadurch
beschriebene Fläche im Verhältnis zu ihrer Länge, bis man schließlich von einem
Zusammenfallen von A mit B sprechen kann, womit wir bei der aktiven Linie
wieder angelangt sind.</p>`), },
    { language: "German edition 1", body: tei("Dies ist die erste Ausgabe"), },
    { language: "German edition 2", body: tei("Dies ist die zweite Ausgabe"), },
    { language: "Italian", body: tei("Questa e' la trascrizione in italiano",`
<p>In questa breve descrizione della linea è implicita quella della superficie:
solo che procede in senso opposto. Quando la linea era attiva divideva in
superfici immaginarie. Il carattere di superficie si faceva poi avanti fino a
diventare attivo nel momento in cui la linea è stata definita passiva. La
superficie allo stato puro è l’elemento placido.</p>

<p>Ma se si pone in movimento, si avvicina al carattere della linea.</p>

<p>Quanto più la linea A-B si prolunga, tanto più sottile diviene la superficie
così descritta in rapporto alla sua lunghezza, sinché alla fine si può parlare
di una coincidenza di A con B, col che nuovamente si giunge alla linea attiva.</p>`), },
    { language: "English", body: tei("This is the english transcription"), },
  ]
};

const i = new Data();
export default i;
