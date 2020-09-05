/// extensionMessage:   An object to make messages between components of the extension consistent
// subject:             A enum string that informs the recipient what to do
// attachments:         If the subject task requires arguments, they can be sent as attachments

// @ts-ignore: Complains this has been declared in background but files are separate
type extensionMessage = {
    subject: string;
    attachments: any;
}

// ========================
// General functions
// ========================

// Get the chrome messages Enum
// @ts-ignore: Complains this has been declared in background but files are separate
let enums;

// @ts-ignore: Complains this has been declared in background but files are separate
async function getEnums() {
    const enumURL: string = chrome.runtime.getURL('/assets/enums.json');
    enums = await fetch(enumURL).then(response => response.json());
}

// ========================
// Chrome messaging
// ========================

let optionsPort: any;
const currentOriginAndPath = window.location.origin + window.location.pathname;

// @ts-ignore: Complains this has been declared in background but files are separate
function setupChromeMessaging() {
    //update to use a UUID or tab name
    optionsPort = chrome.runtime.connect({ name: currentOriginAndPath })

    optionsPort.postMessage({ subject: enums.chromeMessageSubject.openingPort });

    optionsPort.onMessage.addListener(function (message: extensionMessage) {
        console.log('');
        console.log(`Content script received message from background script ${message.subject}`)
        handleIncomingMessage(message);
    });
}

let currentTabId: any;

// handle message from backend
// @ts-ignore: Complains this has been declared in background but files are separate
async function handleIncomingMessage(message: extensionMessage): Promise<boolean> {
    switch (message.subject) {
        case enums.chromeMessageSubject.backgroundScriptConnected:
            currentTabId = message.attachments.tabId;
            console.log(`tabId sent ${message.attachments.tabId}`);
            break;
        case enums.chromeMessageSubject.options.applyUserSettings:
            setupOptions(message.attachments.userName, message.attachments.userColour);
            break;
        default:
            console.error('invalid Enum for message subject: "' + message.subject + '"');
            break;
    }
    return true;
}

// ========================
// Genreral
// ========================

function loadUserSettings() {
    const message: extensionMessage = {
        subject: enums.chromeMessageSubject.options.requestUserSettings,
        attachments: {}
    };

    chrome.runtime.sendMessage(message);
}

function setupOptions(userName:string, userColour:string) {
    // get the current colour and name from bgState
    var applyOptionsButton = document.getElementById('applyOptions');
    applyOptionsButton.addEventListener(
        "click",
        updateOptions
    );

    //Set the form default values to retreived values from state
    document.getElementById('userName').setAttribute('value', userName);
    document.getElementById('hexCode').setAttribute('value', userColour);
}

function updateOptions() {
    //Get form values
    var userName = (<HTMLInputElement>document.getElementById('userName')).value
    var userColour = (<HTMLInputElement>document.getElementById('hexCode')).value;

    //Send message to background with the updated values
    const message: extensionMessage = {
        subject: enums.chromeMessageSubject.options.updateUserSettings,
        attachments: {
            userName,
            userColour
        }
    };

    chrome.runtime.sendMessage(message);
}

document.addEventListener("DOMContentLoaded", function () {
    getEnums().then(() => setupChromeMessaging()).then(() => loadUserSettings())
});