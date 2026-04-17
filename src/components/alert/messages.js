export const MSG = {
  ERROR: {
    ExistDB: {
      Network: `Unable to connect to eXistDB. Please check URLs and your network.`,
      Fetch: `Error occurred while fetching files from the collection.`,
      Authentication: `Authentication failed for eXistDB. Please check your credentials.`,
      Save: `Error occurred while saving document to eXistDB. Please check your data and database state.`,
      Load: `Error occurred during loading to eXistDB. Please check your connection and try again.`,
      List: `Error occurred while fetching the file list from the collection.`
    },
    Alignment: {
      SmartAlign: `Error occurred during smart align. Please check your data and try again.`,
      SmartAlign: (error) => `Alignment failed: ${error.message}. Please check your documents and try again.`,
      InvalidXML: `Invalid XML format. Please check your document.`,
      NoTextToAlign: `One or both documents have no text elements to align.`
    },
    Generic: (error) => `An error occurred: ${error.message}`
  },
  SUCCESS: {
    ExistDB: {
      Sync: `Document loaded correctly from eXistDB.`,
      Auth: `Successfully authenticated with eXistDB.`,
      Connection: `Successfully connected to eXistDB.`,
      Disconnection: `Successfully disconnected from eXistDB.`,
      Save: `Document saved correctly to eXistDB.`

    },
    Alignment: {
      SmartAlignCompleted: `Smart align completed successfully.`,
      Completed: (alignmentsLength) => `Smart alignment complete! Created ${alignmentsLength} alignment${alignmentsLength !== 1 ? `s` : ``}.`,
    },
    Translations: {
      LanguageEdited: `Language edited successfully.`,
      LanguageDeleted: `Language deleted successfully from the project.`
    },
    Generic: (success) => `Operation completed successfully: ${success.message}`

  },
  INFO: {
    ExistDB: {
      SyncStart: `Starting synchronization with eXistDB...`,
      AuthStart: `Authenticating with eXistDB...`,
      ConnectionStart: `Connecting to eXistDB...`,
      DisconnectionStart: `Disconnecting from eXistDB...`,
    },
    Alignment: {
      SmartAlign: {
        Start: `Loading AI model... This may take 30-60 seconds on first use.`,
        ModelLoaded: `Model loaded! Extracting text elements...`,
        Aligning: `Aligning documents... This may take a few moments.`,
        ComputingEmbeddings: `Computing sentence embeddings...`,
        Find: `Finding best alignments...`,
        ElementsFound: (lengthA, languageA, lengthB, languageB) => `Found ${lengthA} elements in ${languageA} and ${lengthB} in ${languageB}`
      }
    },
    Generic: (info) => `Info: ${info.message}`
  },
  WARN: {
    ExistDB: {
      Deprecated: `You are using a deprecated version of eXistDB. Please consider upgrading.`,
      SlowResponse: `eXistDB is responding slowly. This may indicate performance issues.`,
      UnstableConnection: `Connection to eXistDB is unstable. Please check your network.`,
    },
    Translations: {
      EmptyLanguageField: `Language field is empty. Please enter a language name.`
    },
    Generic: (warning) => `Warning: ${warning.message}`
  }
}