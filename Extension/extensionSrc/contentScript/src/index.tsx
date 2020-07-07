
import React from 'react';
import ReactDOM from 'react-dom';

// ========================
// React components
// ========================

function CardsContainer(props: any) {
    const [annotations, setAnnotations] = React.useState(props.storageAnnotations as annotation[]);

    let newAnnotation: annotation = {
        id: annotations.length,
        comment: 'Blam',
        created: Date.now().toString()
    }

    function addDummyAnnotation() {
        setAnnotations(annotations.concat([newAnnotation]));
    }

    const cards = annotations.map((annotation) => {
        return (
            <AnnotationCard
                annotationData={annotation}
                key={annotation.id}
            />
        )
    })

    return (
        <div id='shadowDiv'>
            <h1>Hello, Lets test the cards container</h1>
            <button
                id='createNewAnnotation'
                onClick={() => addDummyAnnotation()}
            >
                Create new annotation
            </button>
            <ol className='cardsContainer'>
                {cards}
            </ol>
        </div>
    );
}

function AnnotationCard(props: any) {
    const annotationData: annotation = props.annotationData;
    return (
        <li className='annotationCard'>
            <p>id: {annotationData.id}</p>
            <p>Comment: {annotationData.comment}</p>
            <p>Created: {annotationData.created}</p>
        </li>
    )
}

// ========================
// Logic
// ========================

type annotation = {
    id: number,
    comment: string,
    created: string
}

let emulatedStorageAnnotations: annotation[] = [];

// Add a couple fake annotations to the emulated storage
for (let i: number = 0; i < 5; i++) {
    let newAnnotation: annotation = {
        id: i,
        comment: 'Blam',
        created: Date.now().toString()
    }
    emulatedStorageAnnotations.push(newAnnotation);
}

// Create a shadow DOM
function createCardContainer() {
    checkNullableObject(document.body.insertAdjacentHTML('afterbegin',
        '<div id="shadowContainer"></div>'
    ));

    const shadowContainer = checkNullableObject(document.querySelector('div#shadowContainer'));
    const shadow = shadowContainer.attachShadow({ mode: 'open' });

    // Render react components inside shadow dom
    ReactDOM.render(
        <CardsContainer
            storageAnnotations={emulatedStorageAnnotations}
        />,
        shadow
    );
    
    //Import styling for shadow dom
    const shadowDiv = shadow.querySelector('#shadowDiv');
    const cardsContainerCssURL = chrome.runtime.getURL('/contentScript/cardsContainer.css');
    fetch(cardsContainerCssURL).then(response => response.text()).then(data => {
        shadowDiv.insertAdjacentHTML('afterbegin', `<style> ${data} </style>`);
    });

}

// Nullable object checker (For typescript Vs. Document object)
function checkNullableObject(nullableObject: any) {
    if (nullableObject === null) {
        console.error('Object was found to be null, it cant be: ', nullableObject);
    } else {
        return nullableObject;
    }
}

createCardContainer();