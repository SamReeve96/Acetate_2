// Get the chrome messages Enum
let enums;

async function getEnums() {
    const enumURL: string = chrome.runtime.getURL('/assets/enums.json');
    enums = await fetch(enumURL).then(response => response.json());
}

// Make this an array of ports so that multiple content scripts can be handled simultaneously
var activeCSPort: any;
type extensionMessage = {
    subject: string
}

function handleMessage(message) {
    switch (message.subject) {
        case enums.chromeMessageSubject.ActivateAcetate:
            const message: extensionMessage = {
                subject: 'ActivateAcetate'
            }
            activeCSPort.postMessage(message);
            break;
    }
    return true;
}

function setupChromeMessaging() {
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
}

getEnums().then(() => setupChromeMessaging());