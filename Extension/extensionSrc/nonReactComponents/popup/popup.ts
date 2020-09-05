/// extensionMessage:   An object to make messages between components of the extension consistent
// subject:             A enum string that informs the recipient what to do
// attachments:         If the subject task requires arguments, they can be sent as attachments
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

function setupPopupControl() {
    let toggle = document.querySelector('#toggle');
    toggle.addEventListener('click', () => {
        // Send message to backend to change active state
        const message: extensionMessage = {
            subject: enums.chromeMessageSubject.popup.changeSheetState,
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