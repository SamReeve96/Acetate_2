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

// @ts-ignore: Complains this has been declared in background but files are separate
type extensionMessage = {
    subject: string;
    attachments: any;
}

function setupPopupControl() {
    let toggle = document.querySelector('#toggle');
    console.log('blam');
    toggle.addEventListener('click', () => {
        // Send message to backend to change active state
        const message: extensionMessage = {
            subject: enums.chromeMessageSubject.toggleAcetate,
            attachments: {}
        };

        chrome.runtime.sendMessage(message);
    });
}

// ========================
// Initiate
// ========================

document.addEventListener("DOMContentLoaded", function () {
    getEnums().then(() => setupPopupControl())
});