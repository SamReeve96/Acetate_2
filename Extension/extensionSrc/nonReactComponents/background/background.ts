import * as cTypes from '../customTypes';

// ========================
// Testing
// ========================

const dummyAnnotation: cTypes.annotation = ({
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
    let bgPortsUpdate = bgPorts.filter((tabIdPort) => {
        return (tabIdPort.tabId !== tabId);
    });

    bgPorts = bgPortsUpdate;
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
        const message: cTypes.extensionMessage = {
            subject: enums.chromeMessageSubject.addNewAnnotation,
            attachments: {}
        }

        sendMessage(message, true, findBgPort(lastActiveTab.tabId));
    }
});


// ========================
// Chrome messaging
// ========================

function sendMessage(message: cTypes.extensionMessage, toContentScript: boolean, recipientPort?: any) {
    if (toContentScript) {
        recipientPort.postMessage(message);
    } else {
        // Send to other areas of the extension, popup for instance
    }
}

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

let bgPorts: tabPort[] = []

function findBgPort(tabId: number): any {
    let tabPortPair = bgPorts.filter((port) => {
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
    bgPorts = bgPorts.filter(bgPort => {
        return bgPort.tabId !== tabId
    });
}

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

        newPort.onMessage.addListener(function (message: cTypes.extensionMessage) {
            console.log(`Background script received message from content script ${message.subject}`)
            handleIncomingMessage(message);
        });

        bgPorts.push({
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

let state: cTypes.extensionState = {
    sheets: Array<cTypes.sheet>(),
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

function addOrUpdateSheet(sheet: cTypes.sheet) {
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

let blankSheet: cTypes.sheet = {
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
function activateSheet(sheetToActivate?: cTypes.sheet) {
    let sheet: cTypes.sheet = blankSheet;

    if (sheetToActivate !== undefined) {
        // check if page has a sheet in the state sheet array, if not initialise a new sheet
        const savedSheet: cTypes.sheet = state.sheets.filter((sheet) => {
            return sheet.url === sheetToActivate.url
        })[0];

        if (savedSheet !== undefined) {
            sheet = savedSheet;
        }
    }

    sheet.active = true;
    sheet.tabId = lastActiveTab.tabId;

    const message: cTypes.extensionMessage = {
        subject: enums.chromeMessageSubject.activateSheet,
        attachments: {
            sheet: sheet
        }
    }

    sendMessage(message, true, findBgPort(lastActiveTab.tabId));

    addControlsToContextmenu();
    changeExtensionIcon(sheet.active);
}

function deactivateSheet(sheet: cTypes.sheet) {
    let sheetToDeactivate = getSheetByTabId(sheet.tabId);

    sheetToDeactivate.active = false

    addOrUpdateSheet(sheetToDeactivate);

    const message: cTypes.extensionMessage = {
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
            syncStoredSheets.map((sheet: cTypes.sheet) => {
                state.sheets.push(sheet);
            }
            );
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