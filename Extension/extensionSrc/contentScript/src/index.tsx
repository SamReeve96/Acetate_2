
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
        created: Date.now().toString(),
        colour: colourArray[Math.floor(Math.random() * colourArray.length)],
        userProfileURL: '',
        userInitials: 'RS'
    }

    function addDummyAnnotation() {
        setAnnotations(annotations.concat([newAnnotation]));
    }

    function handleRemoveAnnotation(annotationId: number) {
        let deleteConfirmed: boolean = window.confirm('Are you sure you want to delete this annotation?');
        if (deleteConfirmed) {
            var annotationsClone: annotation[] = annotations;
            var annotationToDeleteIndex = searchObjectArray(annotationsClone, annotationId, 'id')
            setAnnotations(annotationsClone);
            alert('blam');
        }
    }

    const cards = annotations.map((annotation) => {
        return (
            <AnnotationCard
                annotationData={annotation}
                key={annotation.id}
                removeAnnotation={handleRemoveAnnotation}
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
    const [editMode, setEditMode] = React.useState(false as boolean);

    return (
        <li
            className={`annotationCard '${editMode ? 'edit' : ''}`}
            style={{ backgroundColor: `${annotationData.colour}` }}
        >
            <div className='userID'>
                    <CardIdentifier
                    userProfileURL={annotationData.userProfileURL}
                    userInitials={annotationData.userInitials}
                />
            </div>
            <textarea disabled={!editMode}>
                {annotationData.id + ' ' + annotationData.comment + ' ' + annotationData.created}
            </textarea>
            <ol className='controls'>
                <li title='Edit' onClick={() => { setEditMode(!editMode) }}>
                    &#9997;
                </li>
                <li title='Delete' onClick={() => { props.removeAnnotation() }}>
                    &#128465;
                </li>
                {/* <li title='Begin Thread (Coming soon!)'>
                    &#128284;
                </li> */}
            </ol>
        </li>
    )
}

function CardIdentifier(props: any) {
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
// Acetate Initialisation
// ========================
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

// ========================
// Acetate Functions
// ========================

// "Load" Annotations for the react component prop
type annotation = {
    id: number,
    comment: string,
    created: string,
    colour: string,
    userInitials: string,
    userProfileURL: string
}

let emulatedStorageAnnotations: annotation[] = [];

let colourArray: string[] = ['#6c0097', '#ec922a', '#0ec28c', ''];

// Add a couple fake annotations to the emulated storage
for (let i: number = 0; i < 5; i++) {
    let newAnnotation: annotation = {
        id: i,
        comment: 'Blam',
        created: Date.now().toString(),
        colour: colourArray[Math.floor(Math.random() * colourArray.length)],
        userInitials: 'SR',
        userProfileURL: ''
    }
    emulatedStorageAnnotations.push(newAnnotation);
}

// ========================
// General use functions
// ========================

// Nullable object checker (For typescript Vs. e.g. Document object)
function checkNullableObject(nullableObject: any) {
    if (nullableObject === null) {
        console.error('Object was found to be null, it cant be: ', nullableObject);
    } else {
        return nullableObject;
    }
}

//Object array searcher
function searchObjectArray(array: any[], searchValue: any, objectAttributeName: string) {
    let index: number = 0
    for (index; index < array.length; index++) {

    }
    return index;
}


createCardContainer();