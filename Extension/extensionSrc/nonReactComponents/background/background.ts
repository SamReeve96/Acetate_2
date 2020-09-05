/// extensionState: Stores the state of the extension in the backend
// sheets: an array of sheets currently in use
type extensionState = {
    bgPorts: tabPort[];
    sheets: sheet[];
    user: {
        colour: string;
        userName: string;
    }
}

type selectedElement = {
    type: string,
    auditId: number
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
type annotation = {
    id: number;
    colour: string;
    comment: string;
    created: Date;
    element: any; // make this a  custom type?
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
type sheet = {
    id: string;
    active: boolean;
    annotations: annotation[];
    tabId: number;
    url: string;
}

/// extensionMessage:   An object to make messages between components of the extension consistent
// subject:             A enum string that informs the recipient what to do
// attachments:         If the subject task requires arguments, they can be sent as attachments

// @ts-ignore: Complains this has been declared in background but files are separate
type extensionMessage = {
    subject: string;
    attachments: any;
}

// ========================
// Testing
// ========================

const dummyAnnotation: annotation = ({
    id: 1,
    comment: 'blam',
    created: new Date(Date.now()),
    colour: '',
    element: 'none!',
    userName: 'Johnny Appleseed',
    userProfileURL: ''
});

// ========================
// General functions
// ========================

// Get the chrome messages Enum
// @ts-ignore: Complains this has been declared in popup but files are separate
let enums;

// @ts-ignore: Complains this has been declared in popup but files are separate
async function getEnums() {
    const enumURL: string = chrome.runtime.getURL('/assets/enums.json');
    enums = await fetch(enumURL).then(response => response.json());
}

// ========================
// Browser
// ========================

// icons for Extension state on a tab
const icons = {
    enabled: {
        32: 'assets/AcetateIcon_32.png',
        48: '/assets/AcetateIcon_64.png',
        128: '/assets/AcetateIcon_128.png'
    },
    disabled: {
        32: 'assets/AcetateOffline_32.png',
        48: '/assets/AcetateOffline_64.png',
        128: '/assets/AcetateOffline_128.png'
    }
};

// change the extension icon based on Acetate state
function changeExtensionIcon(extensionState: boolean) {
    const icon = extensionState ? icons.enabled : icons.disabled;
    chrome.browserAction.setIcon({ path: icon });
}

function browserTabChanged(activeTab: any) {
    //Check the new active tab is a normal tab, not a popup page
    if (activeTab.tabId !== -1) {
        // its a usual tab if not -1
        cacheLastActiveTab(activeTab)
        //TODO: When the tab changes check if that tab has an active acetate instance and update the icon accordingly
        //updateExtensionIcon()
    }
}

let lastActiveTab: any = 'unknown';
function cacheLastActiveTab(activeTab: any) {
    lastActiveTab = activeTab;
}

chrome.tabs.onActivated.addListener((activeTab) =>
    browserTabChanged(activeTab))
    ;

// if tab closed remove the port
chrome.tabs.onRemoved.addListener((tabId) => {
    let bgPortsUpdate = state.bgPorts.filter((tabIdPort) => {
        return (tabIdPort.tabId !== tabId);
    });

    state.bgPorts = bgPortsUpdate;
    closePort(tabId);
});

function addControlsToContextmenu() {
    // Create the Annotate right-click menu option (remove all and re-add to ensure it isn't duplicated)
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: enums.chromeContextMenuOptions.AnnotateElement,
            title: 'Annotate %s',
            contexts: ['page', 'selection', 'image', 'link']
        });
    });
}

function removeControlsFromContextMenu() {
    chrome.contextMenus.removeAll();
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === enums.chromeContextMenuOptions.AnnotateElement) {
        const message: extensionMessage = {
            subject: enums.chromeMessageSubject.addNewAnnotation,
            attachments: {}
        }

        sendMessage(message, true, findBgPort(lastActiveTab.tabId));
    }
});


// ========================
// Chrome messaging
// ========================

function sendMessage(message: extensionMessage, toContentScript: boolean, recipientPort?: any) {
    if (toContentScript) {
        recipientPort.postMessage(message);
    } else {
        // Send to other areas of the extension, popup for instance
    }
}

// @ts-ignore: Complains this has been declared in other non react parts but files are separate
function handleIncomingMessage(message) {
    switch (message.subject) {
        case enums.chromeMessageSubject.openingPort:
            break;
        case enums.chromeMessageSubject.contentScriptConnected:
            break;
        //Popup wants to toggle sheet state
        case enums.chromeMessageSubject.popup.changeSheetState:
            changeSheetState();
            break;
        case enums.chromeMessageSubject.sheetToAddOrUpdate:
            addOrUpdateSheet(message.attachments.sheet);
            break;
        case enums.chromeMessageSubject.options.requestUserSettings:
            sendUserSettings();
            break;
        case enums.chromeMessageSubject.options.updateUserSettings:
            updateUserSettings(message.attachments);
            break;
        default:
            console.error('invalid Enum for message subject: "' + message.subject + '"');
            break;
    }
    return true;
}

type tabPort = {
    tabId: number,
    backgroundPort: any
}

function findBgPort(tabId: number): any {
    let tabPortPair = state.bgPorts.filter((port) => {
        return port.tabId === tabId;
    })[0];

    if (tabPortPair !== undefined) {
        return tabPortPair.backgroundPort;
    } else {
        console.error('cant find a message port for this tab...');
    }
}

// call on tab close
function closePort(tabId: number) {
    state.bgPorts = state.bgPorts.filter(bgPort => {
        return bgPort.tabId !== tabId
    });
}

// @ts-ignore: Complains this has been declared in elsewhere but files are separate
function setupChromeMessaging() {
    // Setup contentScript messaging port
    chrome.runtime.onConnect.addListener(function (newPort: any) {
        newPort.postMessage({
            subject: enums.chromeMessageSubject.backgroundScriptConnected,
            attachments: {
                // Send the tabId acetate was activated on so that content script knows what tab it is loaded in
                tabId: lastActiveTab.tabId
            }
        });

        newPort.onMessage.addListener(function (message: extensionMessage) {
            console.log(`Background script received message from content script ${message.subject}`)
            handleIncomingMessage(message);
        });

        state.bgPorts.push({
            tabId: lastActiveTab.tabId,
            backgroundPort: newPort
        });
    });

    // Setup message listener from the popup script
    chrome.runtime.onMessage.addListener(async message => {
        try {
            handleIncomingMessage(message);
        } catch (err) {
            console.log('message error: ' + err.message);
        }
    });
}

// ========================
// state
// ========================

////TODO if a tab is closed, check if the tab had an active sheet, if so save whatever is in the extension state to sync storage
//  Then remove sheet from extension state id saved
////Though this does mean if the app crashes or is closed without the extension still running saved data is lost?

const DefaultColour = '#4B0082';
// NOTE: when a user updates their name, need to update all sheets in bg state to have the new username
const DefaultUserName = 'Sam Reeve'

function sendUserSettings() {
    const message: extensionMessage = {
        subject: enums.chromeMessageSubject.options.applyUserSettings,
        attachments: {
            userColour: state.user.colour,
            userName: state.user.userName
        }
    }

    sendMessage(message, true, findBgPort(lastActiveTab.tabId));
}

function updateUserSettings(userSettings) {
    state.user.userName = userSettings.userName;
    state.user.colour = userSettings.userColour;

    // extra work: iterate over the current active tabs and send a message to update the colour of the user tabs to the new values
}

let state: extensionState = {
    bgPorts: [],
    sheets: Array<sheet>(),
    user: {
        colour: DefaultColour,
        userName: DefaultUserName,
    },
}

//Use tabID & url? to find sheets in the future
function getSheetByUrl(url: string) {
    const filteredSheets = state.sheets.filter((sheet) => {
        return sheet.url === url
    })

    // indexing the first of the array is bad, we need to determine what sheet to return based on the context of the sheet (url/sheet id) and ensure its only a single item
    return filteredSheets[0];
}

//Use tabID & url? to find sheets in the future
function getSheetByTabId(tabId: number) {
    const filteredSheets = state.sheets.filter((sheet) => {
        return sheet.tabId === tabId
    })

    // indexing the first of the array is bad, we need to determine what sheet to return based on the context of the sheet (url/sheet id) and ensure its only a single item
    return filteredSheets[0];
}

function addOrUpdateSheet(sheet: sheet) {
    //Check if the sheet exists in the state if not add, otherwise update
    // Again, hate that url is being used, but works for now
    if (getSheetByUrl(sheet.url) !== undefined) {
        //remove old sheet from state
        const sheetsClone = state.sheets.filter((oldSheet) => {
            oldSheet.url !== sheet.url
        })

        //Add new state
        sheetsClone.push(sheet);
        state.sheets = sheetsClone;

    } else {
        // sheet does not exist in the state
        state.sheets.push(sheet);
    }

    // Update sync storage with the change
    saveStateSheetsToSync();
}

let blankSheet: sheet = {
    id: '',
    active: false,
    annotations: [],
    tabId: -1,
    url: ''
};

function changeSheetState() {
    let sheetToChange = getSheetByTabId(lastActiveTab.tabId);

    // if a new sheet or sheet isn't active on that tab
    if (sheetToChange === undefined || !sheetToChange.active) {
        activateSheet(sheetToChange);
    } else {
        deactivateSheet(sheetToChange);
    }
}

// Url nullable if the sheet isn't in state yet
function activateSheet(sheetToActivate?: sheet) {
    let sheet: sheet = blankSheet;

    if (sheetToActivate !== undefined) {
        // check if page has a sheet in the state sheet array, if not initialise a new sheet
        const savedSheet: sheet = state.sheets.filter((sheet) => {
            return sheet.url === sheetToActivate.url
        })[0];

        if (savedSheet !== undefined) {
            sheet = savedSheet;
        }
    }

    sheet.active = true;
    sheet.tabId = lastActiveTab.tabId;

    const message: extensionMessage = {
        subject: enums.chromeMessageSubject.activateSheet,
        attachments: {
            sheet: sheet,
            userColour: state.user.colour,
            userName: state.user.userName
        }
    }

    sendMessage(message, true, findBgPort(lastActiveTab.tabId));

    addControlsToContextmenu();
    changeExtensionIcon(sheet.active);
}

function deactivateSheet(sheet: sheet) {
    let sheetToDeactivate = getSheetByTabId(sheet.tabId);

    sheetToDeactivate.active = false

    addOrUpdateSheet(sheetToDeactivate);

    const message: extensionMessage = {
        subject: enums.chromeMessageSubject.deactivateSheet,
        attachments: {}
    }

    sendMessage(message, true, findBgPort(sheet.tabId));

    removeControlsFromContextMenu();
    changeExtensionIcon(sheet.active);
}

// ========================
// Storage management
// ========================

// Check if Ace is to open the comment window and contain content on page load by default
chrome.storage.sync.get('activeOnPageLoad', data => {
    const activeOnPageLoad = data.activeOnPageLoad;

    if (activeOnPageLoad === undefined) {
        // initialise default option state
        chrome.storage.sync.set({ activeOnPageLoad: false })
    }
    else if (activeOnPageLoad) {
        // Load Acetate UI
    }
});

// Load sheets from sync storage
function loadSheetsFromSync() {
    chrome.storage.sync.get('syncStoredSheets', data => {
        const syncStoredSheets = data.syncStoredSheets
        if (syncStoredSheets === undefined) {
            // initialise default option state
            chrome.storage.sync.set({ syncStoredSheets: [] })
        } else {
            syncStoredSheets.map((sheet: sheet) => {
                state.sheets.push(sheet);
            });
        }
    });
}

// Save sheet data to google sync storage
function saveStateSheetsToSync() {
    // Reset values of inactive sheets so that new ports and tabIds are assigned on reactivation
    // state.sheets.map((sheet) => {
    //     if (!sheet.active) {
    //         sheet.tabId = -1;
    //     }
    // });
    chrome.storage.sync.set({ syncStoredSheets: state.sheets })
}

// ========================
// Prepare extension for activation
// ========================
// Could disable this running by default as it might have performance 
// issues for the browser and add an option informing the user of the risks
getEnums().then(() => setupChromeMessaging()).then(() => loadSheetsFromSync());