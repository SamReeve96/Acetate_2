/// extensionState: Stores the state of the extension in the backend
// sheets: an array of sheets currently in use
export type extensionState = {
    sheets: sheet[];
}

// ========================
// Clone from the react customTypes.ts file both should be kept identical from this point
// ========================

/// annotation:     The object to store annotation information
// id:              Id of the annotation (will be assigned by some UUID generator when implemented)
// comment:         What the user commented about an element
// created:         DateTime of Creation
// colour:          Colour the annotation card should be (inherited by creator chosen colour)
// userName:        The username that created the comment
// userProfileURL   The URL to the users profile icon (Could be moved to a separate storage location to remove duplication for each comment)
export type annotation = {
    id: number;
    comment: string;
    created: Date;
    createdString: string;
    colour: string;
    userName: string;
    userProfileURL: string;
}

/// Sheet:          The object to store all information
///                 about an instance of an annotated page
// id:              The Sheets ID, (will be assigned by some UUID generator when implemented)
// active:          A flag indicating if the sheet currently active on a tab
// annotations:     An array of annotation objects
// backgroundPort:  The port object the bg script uses to communicate with the tab with the currently open sheet
// csPort:          The port object the cs script uses to communicate with the background script
// tabId:           The id of the Tab the sheet is active on
// url:             The url of the page being annotated
export type sheet = {
    id: string;
    active: boolean;
    annotations: annotation[];
    backgroundPort: any;
    csPort: any;
    tabId: number;
    url: string;
}

/// extensionMessage:   An object to make messages between components of the extension consistent
// subject:             A enum string that informs the recipient what to do
// attachments:         If the subject task requires arguments, they can be sent as attachments
export type extensionMessage = {
    subject: string;
    attachments: any;
}
