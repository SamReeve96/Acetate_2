
import React from 'react';
import ReactDOM from 'react-dom';

// ========================
// React components
// ========================

function CardsContainer(props: any) {
    const [annotations, setAnnotations] = React.useState(props.storageAnnotations as annotation[]);

    let newAnnotation: annotation = {
        id: annotations.length,
        comment: Lorum,
        created: Date.now().toString(),
        colour: colourArray[Math.floor(Math.random() * colourArray.length)],
        userProfileURL: '',
        userInitials: '??'
    }

    function addDummyAnnotation() {
        setAnnotations(annotations.concat([newAnnotation]));
    }

    function handleRemoveAnnotation(annotationId: number) {
        let deleteConfirmed: boolean = window.confirm('Are you sure you want to delete this annotation?');
        if (deleteConfirmed) {
            //var annotationsClone: annotation[] = annotations;
            //var annotationToDeleteIndex = searchObjectArray(annotationsClone, annotationId, 'id')
            //setAnnotations(annotationsClone);
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
    const [controlsMenuOpen, setControlsMenuOpen] = React.useState(true as boolean);

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
            <div className='cardMain'>
                <div className='cardHeader'>
                    <div className='cardTitle'>
                        <p className='username'>User Name</p>
                        <p className='created'>Created just now</p>
                    </div>
                    <div className='controls'>
                        <p title='Edit' onClick={() => { setEditMode(!editMode) }}>
                            Edit
                        </p>
                        <p title='Delete' onClick={() => { props.removeAnnotation() }}>
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
                    <textarea disabled={!editMode}>
                        {annotationData.id + ' ' + annotationData.comment + ' ' + annotationData.created}
                    </textarea>
                </div>
            </div>
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

    // Import styling for shadow dom
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

const Lorum = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, 
sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in 
reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla 
pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa 
qui officia deserunt mollit anim id est laborum.`

createCardContainer();