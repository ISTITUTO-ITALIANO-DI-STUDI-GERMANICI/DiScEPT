import * as React from "react";

import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";

import Title from '../components/title.js';

function IntroView() {
  return (
    <Box>
      <Title title="DiScEPT" />

      <p>
        La piattaforma per edizioni scientifiche digitali DiScEPT nasce con
        l’obiettivo di raccogliere metodologie, protocolli e buone pratiche
        consolidate dai molti progetti che sono stati sviluppati nell’ambito
        della filologia e dell’editoria digitale e che hanno creato una comunità
        di utenti e sviluppatori intorno a essi. Si vuole dunque riutilizzare e
        integrare strumenti, servizi e formati già disponibili e ben noti a
        editori e studiosi in un ecosistema che tenga presente ogni momento
        della filiera editoriale dalla produzione alla fruizione di un’edizione.
        L’obiettivo è inoltre quello di avere un ambiente di lavoro per editori
        più o meno esperti di filologia digitale sulla base dei principi di{" "}
        <Tooltip title="Martignano, Chiara. 2021. “A Conceptual Model to Encourage the Development and Reuse of Apps for Digital Editions”. Umanistica Digitale 5 (10):71-88. https://doi.org/10.6092/issn.2532-8816/12620">
          <u>accessibilità e di riuso</u>
        </Tooltip>
        . Tre sono i punti in particolare da affrontare
      </p>

      <ul>
        <li>produzione, uso e riuso dei dati e metadati;</li>
        <li>
          riuso di componenti software e applicativi e di processi di flusso di
          lavoro;
        </li>
        <li>condivisione di linee guida e buone pratiche.</li>
      </ul>

      <p>
        Questa piattaforma, in primo luogo, permette la produzione di{" "}
        <Tooltip title="Pierazzo, Elena. Digital Scholarly Editing: Theories, Models and Methods. Farnham, Surrey: Ashgate, 2015">
          <u>edizioni scientifiche digitali</u>
        </Tooltip>
        , la codifica dei dati e la descrizione dei metadati attraverso formati
        diversi, come ad esempio XML-TEI, XML-RDF, JSON-LD, focalizzandosi in
        particolare sull’aspetto dell’allineamento tra edizioni diverse e loro
        diverse traduzioni. L'obiettivo finale è quello di rendere le pratiche
        editoriali più rispondenti alle esigenze dei filologi, di creare risorse
        che abbiano alla base una strategia di sostenibilità e di FAIRificazione
        dei contenuti. Il fine è di realizzare un ecosistema collegato con altre
        risorse sul Web e che tenga presente la valorizzazione dei dati come
        pratica permanente e diffusa nell’ambito degli studi umanistici e del
        dominio degli archivi e delle biblioteche. Questo ecosistema della
        testualità digitale si pone dunque come scopo quello di ampliare,
        attraverso la produzione di dati, e la curatela di questi in ambito
        editoriale, la conoscenza e l'organizzazione degli artefatti in tutte le
        loro forme e di ampliare il coinvolgimento del pubblico, nonché di
        migliorare l'accessibilità, l’inclusività, la fruizione e di rafforzare
        la ricerca multidisciplinare.
      </p>

      <p>
        In questo contesto, è bene sottolineare che le traduzioni allineate non
        sono solo un utile sussidio, ma costituiscono un vero e proprio
        arricchimento filologico; devono infatti essere considerate un
        fondamentale strumento per l’analisi semantica nel suo senso più ampio,
        non solo nella sua funzione contrastiva e disambiguante. Come nel caso
        di traduzioni storiche che vengano confrontate con traduzioni moderne,
        può venire chiamata in causa la storia della lingua, la storia della
        ricezione e più in generale le varie dinamiche interculturali; anche
        quando si tratta di traduzioni tra due tipologie di testo diverse, per
        esempio dalla poesia alla prosa, dal dialogo al riassunto in un discorso
        indiretto (che richiede naturalmente decisioni tecniche sulla
        granularità del testo, parola, frase, paragrafo, unità semantica), il
        confronto può arricchire le analisi stilistiche anche attraverso
        strumenti computazionali. Proprio per questo motivo{" "}
        <Tooltip title="Pozzo, Riccardo; Gatta Timon; Hohenegger, Hansmichael; Kuhn, Jonas; Pichler, Axel; Turchi, Marco and Genabith, Josef van. “Aligning Immanuel Kant’s Work and its Translations”. In CLARIN: The Infrastructure for Language Resources. Edited by Fišer, D.  and Witt, A. Berlin, Boston: De Gruyter, 2022, pp. 727-746. https://doi.org/10.1515/9783110767377-029">
          <u>l’allineamento</u>
        </Tooltip>{" "}
        prevede che si possano associare sia lingue diverse sia diverse
        traduzioni nella stessa lingua. Le due parti, edizione e traduzioni, in
        DiScEPT non sono pensate come rigidamente separate, ma servono entrambe
        per studiare la mobilità dei linguaggi, ovvero dei testi che nella
        propria tradizione/traduzione ne possono rendere testimonianza. In
        questo senso, e da sempre, la diversità linguistica è una ricchezza per
        lo studio filologico.
      </p>

      <p>
        Rinunciamo, però, a sposare una delle tante, magari ottime, teorie
        traduttologiche o di legarci a una delle tipizzazione dei testi basate
        sulle teorie linguistiche di K. Bühler o di R. Jakobson. Piuttosto,
        senza pretese sistematiche, pensiamo a fornire tipologie di traduzioni
        basate sui generi letterari, e usiamo i concetti chiave della
        traduttologia sempre solo operativamente: per esempio, le opposizioni
        come quella tra{" "}
        <Tooltip title="Froeliger, Nicolas. Les Noces de l'analogique et du numérique. De la traduction pragmatique: Paris, Les Belles Lettres, 2013">
          <u>traduzione letteraria e traduzione pragmatica</u>
        </Tooltip>
        ; oppure quella tra{" "}
        <Tooltip title="Ladmiral, Jean-René. Sourcier ou cibliste: Les Belles Lettres, Paris 2014.">
          <u>traduttori ciblistes e traduttori sourciers</u>
        </Tooltip>
        , rispettivamente più vicini al testo sorgente o più vicini al testo
        d’arrivo.
      </p>

      <p>
        Ogni teoria traduttologica viene presa in considerazione se,
        valorizzabile con un’applicazione digitale, aumenta non solo la qualità
        ma la stessa coscienza della pratica filologica e/o traduttoria. Così
        gli strumenti di estrazione della terminologia, le analisi stilistiche
        comparative o le analisi distribuzionali sono al servizio della migliore
        risposta alle esigenze dell’editore/traduttore: nel caso quella di
        rendere più coerente la terminologia (dello stesso o di diversi
        traduttori) o, al contrario, decidere per una varietà di resa basandosi
        su un’analisi nella quale il contesto è da ritenersi più determinante.
      </p>
    </Box>
  );
}

const IntroOnboarding = [
  {
    popover: {
      title: "DiScEPT",
      description:
        "DiScEPT is a nice tool. But we need to write the documentation! TODO",
    },
  },
  {
    element: "#discept-file-uploader",
    popover: {
      title: "Upload your TEI files",
      description: "DiScEPT supports TEI as input and as output. TODO",
    },
  },
  {
    element: "#step-1",
    popover: {
      title: "Project description",
      description: "Here you can write your project details",
    },
  },
  {
    element: "#step-2",
    popover: { title: "Define your translation sources", description: "TODO" },
  },
  {
    element: "#step-3",
    popover: { title: "Align your translation sources", description: "TODO" },
  },
  {
    element: "#step-4",
    popover: {
      title: "Image support",
      description: "Do you want to add images? TODO",
    },
  },
  {
    element: "#step-5",
    popover: { title: "Download your final TEI", description: "TODO" },
  },
  {
    element: "#help",
    popover: { title: "Click here for help!", description: "TODO" },
  },
];

export { IntroView, IntroOnboarding };
