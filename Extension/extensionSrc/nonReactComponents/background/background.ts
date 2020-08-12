import { annotation, extensionMessage, sheet } from '../customTypes';

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

// Change Icon based on state
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

let activeTabCacheId: any = 'unknown';

function cacheActiveTab(activeTab: any) {
    //Check the new active tab is a normal tab, not a popup page
    if (activeTab.tabId !== -1) {
        // its a usual tab if not -1
        activeTabCacheId = activeTab.tabId;
    }
}

chrome.tabs.onActivated.addListener((activeTab) => cacheActiveTab(activeTab));

// ========================
// Chrome messaging
// ========================

// Make this an array of ports so that multiple content scripts can be handled simultaneously
//var activeCSPort: any;

function sendMessage(toContentScript: boolean, recipientPort: any, message: extensionMessage) {
    if (toContentScript) {
        recipientPort.postMessage(message);
    } else {
        // Send to other areas of the extension, popup for instance
    }
}

function handleMessage(message) {
    switch (message.subject) {
        case enums.chromeMessageSubject.toggleSheetActiveState:
            toggleSheetActiveState();
            break;
        case enums.chromeMessageSubject.sheetToAddOrUpdate:
            addOrUpdateSheet(message.attachments.sheet);
            break;
        case enums.chromeMessageSubject.openingPort:
            break;
        case enums.chromeMessageSubject.contentScriptConnected:
            break;
        default:
            console.error('invalid Enum for message subject: "' + message.subject + '"');
            break;
    }
    return true;
}

let backgroundPortCache;
function setupChromeMessaging() {

    // Setup content script ports
    chrome.runtime.onConnect.addListener(function (newPort: any) {
        backgroundPortCache = newPort;
        backgroundPortCache.postMessage({
            subject: enums.chromeMessageSubject.backgroundScriptConnected,
            attachments: {
                tabId: activeTabCacheId
            }
        });

        backgroundPortCache.onMessage.addListener(function (message: extensionMessage) {
            console.log(`Background script received message from content script ${message.subject}`)
            handleMessage(message);
        });
    });

    // Setup messages from the popup
    chrome.runtime.onMessage.addListener(async message => {
        try {
            handleMessage(message);
        } catch (err) {
            console.log('message error: ' + err.message);
        }
    });
}

// ========================
// Storage management
// ========================
// Open the comment window and contain content on page load
chrome.storage.sync.get('activeOnPageLoad', data => {
    const savedStateActive = data.activeOnPageLoad;

    if (savedStateActive === undefined) {
        // initialise option
        chrome.storage.sync.set({ savedStateActive: false })
    } 
    else if (savedStateActive) {
        // Load Acetate UI
    }
});

function saveSheetToSync(extensionState) {
    chrome.storage.sync.set({ extensionState: extensionState })
}


// ========================
// state
// ========================

type extensionState = {
    sheets: sheet[];
}

let state: extensionState = {
    sheets: Array<sheet>(),
}

//Use tabID & url? to find sheets in the future
function getSheet(url: string) {
    const filteredSheets = state.sheets.filter((sheet) => {
        return sheet.url === url
    })

    // This is bad, we need to determine what sheet to return based on the context of the sheet (url/sheet id)
    return filteredSheets[0];
}

function addOrUpdateSheet(sheet: sheet) {
    //Check if the sheet exists in the state if not add, otherwise update
    // Again, hate that url is being used, but works for now
    if (getSheet(sheet.url) !== undefined) {
        //remove old sheet from state
        const sheetsClone = state.sheets.filter((oldSheet) => {
            oldSheet.url !== sheet.url
        })

        //Add new state
        sheetsClone.push(sheet);
        state.sheets = sheetsClone;

    } else {
        state.sheets.push(sheet);
    }
}

function toggleSheetActiveState() {
    const sheetsWithSameTabId = state.sheets.filter((sheet) => {
        return activeTabCacheId === sheet.tabId
    });

    const currentSheet = sheetsWithSameTabId[0];
    currentSheet.backgroundPort = backgroundPortCache;
    backgroundPortCache
     = undefined;

    const message: extensionMessage = {
        subject: enums.chromeMessageSubject.toggleSheetActiveState,
        attachments: {
            activeState: currentSheet.active
        }
    }

    sendMessage(true, currentSheet.backgroundPort, message);
    currentSheet.active = !currentSheet.active;
    changeExtensionIcon(currentSheet.active);
}

// ========================
// Prepare extension for activation
// ========================
// Could disable this running by default as it might have performance 
// issues for the browser and add an option informing the user of the risks
getEnums().then(() => setupChromeMessaging());