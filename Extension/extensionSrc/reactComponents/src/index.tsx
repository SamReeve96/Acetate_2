import React, { ReactElement } from 'react';
import ReactDOM from 'react-dom';
import * as cTypes from './customTypes';
import { checkNullableObject } from './shared';

const currentOriginAndPath = window.location.origin + window.location.pathname;

const blankSheet: cTypes.sheet = {
    id: currentOriginAndPath,
    active: false,
    annotations: [],
    tabId: -1,
    url: currentOriginAndPath
};

let currentSheet: cTypes.sheet;
let currentTabId: number = -1;

// ========================
// Testing
// ========================



// ========================
// General functions
// ========================

// Get the Enums

let enums: any;

async function getEnums() {
    const enumURL: string = chrome.runtime.getURL('/assets/enums.json');
    enums = await fetch(enumURL).then(response => response.json());
    console.log('enums');
    console.log(enums);
}

function deactivateSheet() {
    // Remove content script contents
    const shadowContainer = checkNullableObject(document.querySelector('#shadowContainer'));
    shadowContainer.parentNode.removeChild(shadowContainer);

    // reset sheet data
    currentSheet = blankSheet;
}

function activateSheet(sheet: cTypes.sheet) {
    currentSheet = sheet;

    if (currentSheet.url === undefined) {
        currentSheet.url = currentOriginAndPath;
    }

    currentSheet.tabId = currentTabId;

    sendSheetToBackground();

    //Add extension elements
    checkNullableObject(document.body.insertAdjacentHTML('afterbegin',
        '<div id="shadowContainer"></div>'
    ));

    const shadowContainer: HTMLElement = checkNullableObject(document.querySelector('div#shadowContainer'));
    const shadow = shadowContainer.attachShadow({ mode: 'open' });


    // Render react components inside shadow dom
    ReactDOM.render(
        <CardsContainer
            storageAnnotations={currentSheet.annotations}
        />,
        shadow
    );

    // Import styling for shadow dom
    const shadowDiv = checkNullableObject(shadow.querySelector('#shadowDiv'));
    const cardsContainerCssURL = chrome.runtime.getURL('/contentScript/cardsContainer.css');
    fetch(cardsContainerCssURL).then(response => response.text()).then(data => {
        shadowDiv.insertAdjacentHTML('afterbegin', `<style> ${data} </style>`);
    });
}

// Must be a better way to update the state externally (see redux) but for now...
function reloadReactComponents() {
    // Remove content script contents
    const oldShadowContainer = checkNullableObject(document.querySelector('#shadowContainer'));
    oldShadowContainer.parentNode.removeChild(oldShadowContainer);

    //Add extension elements
    checkNullableObject(document.body).insertAdjacentHTML('afterbegin',
        '<div id="shadowContainer"></div>'
    );

    const redrawnShadowContainer = checkNullableObject(document.querySelector('#shadowContainer'));
    const newShadow = redrawnShadowContainer.attachShadow({ mode: 'open' });

    // Render react components inside shadow dom
    ReactDOM.render(
        <CardsContainer
            storageAnnotations={currentSheet.annotations}
        />,
        newShadow
    );

    // Import styling for shadow dom
    const newShadowDiv = checkNullableObject(newShadow.querySelector('#shadowDiv'));
    const cardsContainerCssURL = chrome.runtime.getURL('/contentScript/cardsContainer.css');
    fetch(cardsContainerCssURL).then(response => response.text()).then(data => {
        newShadowDiv.insertAdjacentHTML('afterbegin', `<style> ${data} </style>`);
    });
}
            
// Label all elements on the page we can authenticate an element is the same as it was when created by comparing auditID and element type
function auditContentPageElements() {
    let elementCounter = 1;
    const elementsToAudit = checkNullableObject(document.querySelector('body'));
    elementsToAudit.querySelectorAll('*').forEach((element: HTMLElement) =>  {
        element.setAttribute('acetateElementId', elementCounter.toString());
        elementCounter++;
    });
}

// tracks the last element the user right-clicked on
let contextElement = {
    elementId: -1,
    type: 'unknown'
}
// Just getting element data rn, but in future use this to gen an id for an element to find it again when reloading the sheet
document.addEventListener('contextmenu', e => {
    // @ts-ignore: does exist TS is being a pain
    contextElement.type = e.target.nodeName;
    // @ts-ignore: does exist TS is being a pain
    contextElement.elementId = e.target.getAttribute('acetateElementId');
});

const addNewAnnotation = () => {
    const newAnnotation: cTypes.annotation = {
        id: -1,
        colour: '',
        comment: 'new Annotation test',
        created: new Date(Date.now()),
        element: contextElement,
        userProfileURL: '',
        userName: 'Test Name'
    }

    currentSheet.annotations.push(newAnnotation);

    reloadReactComponents();
    sendSheetToBackground();

    contextElement = {
        elementId: -1,
        type: 'unknown'
    }
}

// ========================
// Storage management
// ========================
let csPort: any;

// send the sheet to thr background to be added or to update a pre existing sheet in the background state
function sendSheetToBackground() {
    csPort.postMessage({
        subject: enums.chromeMessageSubject.sheetToAddOrUpdate,
        attachments: {
            sheet: currentSheet
        }
    });
}

// ========================
// Chrome messaging
// ========================

// handle message from backend
async function handleIncomingMessage(message: cTypes.extensionMessage): Promise<boolean> {
    switch (message.subject) {
        case enums.chromeMessageSubject.activateSheet:
            activateSheet(message.attachments.sheet);
            break;
        case enums.chromeMessageSubject.deactivateSheet:
            deactivateSheet();
            break;
        case enums.chromeMessageSubject.backgroundScriptConnected:
            currentTabId = message.attachments.tabId;
            console.log(`tabId sent ${message.attachments.tabId}`);
            break;
        case enums.chromeMessageSubject.addNewAnnotation:
            addNewAnnotation();
            break;
        default:
            console.error('invalid Enum for message subject: "' + message.subject + '"');
            break;
    }
    return true;
}

function setupChromeMessaging() {
    //update to use a UUID or tab name
    csPort = chrome.runtime.connect({ name: currentOriginAndPath })

    csPort.postMessage({ subject: enums.chromeMessageSubject.openingPort });

    csPort.onMessage.addListener(function (message: cTypes.extensionMessage) {
        console.log('');
        console.log(`Content script received message from background script ${message.subject}`)
        handleIncomingMessage(message);
    });
}

// ========================
// React components
// ========================

function CardsContainer(props: any): ReactElement {
    //SET ANNOTATIONS NOT WORKING????
    const [annotations, setAnnotations] = React.useState(props.storageAnnotations as cTypes.annotation[]);

    //Use effect Not triggering correctly right now
    React.useEffect(() => {
        // Update the document title using the browser API
        document.title = document.title + ` : (Acetate Active) - ${annotations.length} annotations`;
    });

    //When reacts state changes, sync those changes with the chrome sheet and the background sheet array
    function syncSheetWithReactAnnotations(newAnnotations?: cTypes.annotation[]) {
        //Set the sheet annotations value to what was changed or to the sheet if nothing provided
        if (newAnnotations !== undefined) {
            currentSheet.annotations = newAnnotations;
        } else {
            currentSheet.annotations = annotations;
        }

        // update background sheet
        sendSheetToBackground();
    }

    function deleteAnnotation(annotationId: number): void {
        const deleteConfirmed: boolean = window.confirm('Are you sure you want to delete this annotation?');
        if (deleteConfirmed) {
            const annotationsClone: cTypes.annotation[] = annotations.filter(annotation => annotation.id !== annotationId);
            setAnnotations(annotationsClone);
            syncSheetWithReactAnnotations(annotationsClone);
        }
    }

    const cards = annotations.map((annotation) => {
        return (
            <AnnotationCard
                key={annotation.id}
                annotationData={annotation}
                annotationMethods={{ syncSheetWithReactAnnotations, deleteAnnotation }}
            />
        )
    })

    return (
        <div id='shadowDiv'>
            <ol className='cardsContainer'>
                {cards}
            </ol>
        </div>
    );
}

function AnnotationCard(props: any): ReactElement {
    const [annotationData, setAnnotationData] = React.useState(props.annotationData);
    const [annotationComment, setAnnotationComment] = React.useState(props.annotationData.comment);
    const deleteAnnotation = (annotationId: number): void => props.annotationMethods.deleteAnnotation(annotationId);
    const [editMode, setEditMode] = React.useState(false as boolean);

    function extractInitials(): string {
        const userName = annotationData.userName;
        const matches = checkNullableObject(userName.match(/\b(\w)/g));
        return matches.join('');
    }

    function getAnnotationFormattedDatetime() {
        const formattedTime = new Date(annotationData.created).toLocaleTimeString();
        const formattedDate = new Date (annotationData.created).toLocaleDateString();
        return `${formattedDate} ${formattedTime}`;
    }

    function saveComment(newComment: string): void {
        let updatedAnnotationData = annotationData;
        updatedAnnotationData.comment = newComment;
        setAnnotationData(updatedAnnotationData);
        setEditMode(false);

        // move this to an effect to sync on any change
        props.annotationMethods.syncSheetWithReactAnnotations();
    }

    return (
        <li
            className={`annotationCard ${editMode ? 'edit' : ''}`}
            style={{ backgroundColor: `${annotationData.colour}` }}
        >
            <div className='userID'>
                <CardIdentifier
                    userProfileURL={annotationData.userProfileURL}
                    userInitials={extractInitials()}
                />
            </div>
            <div className='cardMain'>
                <div className='cardHeader'>
                    <div className='cardTitle'>
                        <p className='username'>{annotationData.userName}</p>
                        <p className='created'>Created: {getAnnotationFormattedDatetime()}</p>
                    </div>
                    <div className='controls'>
                        <p
                            title='Edit'
                            onClick={
                                (): void => { editMode ? saveComment(annotationComment) : setEditMode(true) }
                            }
                        >
                            {editMode ? 'Done' : 'Edit'}
                        </p>
                        <p
                            title='Delete'
                            onClick={(): void => { deleteAnnotation(annotationData.id) }}
                        >
                            Delete
                        </p>
                        {/* 
                            
                            Will props move this out of this menu? Need to think about it when its working
                            
                            <p title='Begin Thread (Coming soon!)'>
                            &#128284;
                            </p> */}
                    </div>
                </div>
                <div className='cardBody'>
                    <textarea
                        disabled={!editMode}
                        value={annotationComment}
                        onChange={(e): void => setAnnotationComment(e.target.value)}
                    />
                </div>
            </div>
        </li>
    )
}

function CardIdentifier(props: any): ReactElement {
    const userProfileURL: string = props.userProfileURL;
    const userInitials: string = props.userInitials;

    if (userProfileURL !== '') {
        return <img alt='userProfile' src={userProfileURL}></img>
    }
    else {
        return <p className='initials'>{userInitials}</p>
    }
}

// ========================
// Initiate
// ========================

getEnums().then(() => setupChromeMessaging());
auditContentPageElements();