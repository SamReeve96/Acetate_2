// Clone from the react customTypes.ts file both should be kept identical

export type annotation = {
    id: number;
    comment: string;
    created: Date;
    colour: string;
    userName: string;
    userProfileURL: string;
}

/// Sheet - the object to store all information
/// about an instance of an annotated page
// active - is the sheet currently active on a tab
// annotations - an array of annotation objects
// url - the url of the page being annotated
export type sheet = {
    id: string;
    active: boolean;
    annotations: annotation[];
    backgroundPort: any;
    csPort: any;
    tabId: number;
    url: string;
}

// @ts-ignore: Complains this has been declared in popup but files are separate
export type extensionMessage = {
    subject: string;
    attachments: any;
}
