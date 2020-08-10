chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const port = chrome.tabs.connect(tabs[0].id);
    port.postMessage({ function: 'html' });
    let blam = {
        html: '',
        title: ''
    };
    port.onMessage.addListener((response) => {
        blam.html = response.html;
        blam.title = response.title;
    });
});

// Get the chrome messages Enum
async function getEnums() {
    const enumURL: string = chrome.runtime.getURL('/assets/enums.json');
    const enums = await fetch(enumURL).then(response => response.json());
    return enums;
}

function setupChromeMessaging(enums) {

    function handleMessage(message) {
        console.log('got a message!');
        console.log(message);
        switch (message.type) {
            case enums.chromeMessageSubject.ActivateAcetate:
                const message = {
                    type: enums.chromeMessageSubject.ActivateAcetate
                }

                console.log('sending message:');
                console.log(message);

                chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                    chrome.tabs.sendMessage(tabs[0].id, message, null, () => { return true; });
                });
                break;
            case "DeactivateAcetate":
                alert('blam')
                break;
        }
        return true;
    }

    // // Add listener for messages
    // chrome.runtime.onMessage.addListener(async message => {
    //     try {
    //         handleMessage(message);
    //     } catch (err) {
    //         console.error('message error: ' + err.message);
    //     }
    // });


}

getEnums().then((enums) => setupChromeMessaging(enums));