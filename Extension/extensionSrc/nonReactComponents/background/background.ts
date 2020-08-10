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

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.browserAction.setIcon({ path: icon });
    });
}


// ========================
// Chrome messaging
// ========================

// Make this an array of ports so that multiple content scripts can be handled simultaneously
var activeCSPort: any;
// @ts-ignore: Complains this has been declared in popup but files are separate
type extensionMessage = {
    subject: string;
    attachments: any;
}

function handleMessage(message) {
    switch (message.subject) {
        case enums.chromeMessageSubject.toggleAcetate:
            
            const message: extensionMessage = {
                subject: enums.chromeMessageSubject.toggleAcetate,
                attachments: {
                    activeState: extensionState.active
                }
            }
            
            activeCSPort.postMessage(message);
            extensionState.active = !extensionState.active;
            changeExtensionIcon(extensionState.active);
            break;
    }
    return true;
}

function setupChromeMessaging() {
    // Setup content script ports
    chrome.runtime.onConnect.addListener(function (newPort: any) {
        activeCSPort = newPort;
        activeCSPort.postMessage({
            subject: 'content script connected'
        });

        activeCSPort.onMessage.addListener(function (message: extensionMessage) {
            console.log("Background script received message from content script")
            console.log(`--- ${message.subject} ---`)
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
// Initiate
// ========================
let extensionState = {
    active: false
}

getEnums().then(() => setupChromeMessaging());