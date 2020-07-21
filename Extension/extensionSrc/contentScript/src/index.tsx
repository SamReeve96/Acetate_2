
import React from 'react';
import ReactDOM from 'react-dom';

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
// React components
// ========================

function CardsContainer(props: any) {
    const [annotations, setAnnotations] = React.useState(props.storageAnnotations as annotation[]);

    let newAnnotation: annotation = {
        id: annotations.length,
        comment: blamString,
        created: new Date(Date.now()),
        colour: colourArray[Math.floor(Math.random() * colourArray.length)],
        userProfileURL: '',
        userName: 'Test Name'
    }

    function addDummyAnnotation() {
        setAnnotations(annotations.concat([newAnnotation]));
    }

    function deleteAnnotation(annotationId: number) {
        let deleteConfirmed: boolean = window.confirm('Are you sure you want to delete this annotation?');
        if (deleteConfirmed) {
            var annotationsClone: annotation[] = annotations.filter(annotation => annotation.id !== annotationId);
            setAnnotations(annotationsClone);
        }
    }

    const cards = annotations.map((annotation) => {
        return (
            <AnnotationCard
                annotationData={annotation}
                key={annotation.id}
                annotationMethods={{ deleteAnnotation }}
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

function AnnotationCard(props: any) {
    const [annotationData, setAnnotationData] = React.useState(props.annotationData);
    const [annotationComment, setAnnotationComment] = React.useState(props.annotationData.comment);

    const deleteAnnotation = (annotationId: number) => props.annotationMethods.deleteAnnotation(annotationId);
    const [editMode, setEditMode] = React.useState(false as boolean);

    function extractInitials() {
        var userName = annotationData.userName;
        var matches = checkNullableObject(userName.match(/\b(\w)/g));
        return matches.join('');
    }

    function saveComment(newComment: string) {
        props.annotationData.comment = newComment;
        setEditMode(false);
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
                        <p className='created'>Created: {annotationData.created.toLocaleDateString()}</p>
                    </div>
                    <div className='controls'>
                        <p
                            title='Edit'
                            onClick={
                                () => { editMode ? saveComment(annotationComment) : setEditMode(true) }
                            }
                        >
                            {editMode ? 'Done' : 'Edit'}
                        </p>
                        <p
                            title='Delete'
                            onClick={() => { deleteAnnotation(annotationData.id) }}
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
                        onChange={e => setAnnotationComment(e.target.value)}
                    />
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
// Acetate Functions
// ========================

// "Load" Annotations for the react component prop
type annotation = {
    id: number,
    comment: string,
    created: Date,
    colour: string,
    userName: string,
    userProfileURL: string
}

let emulatedStorageAnnotations: annotation[] = [];

let colourArray: string[] = ['#6c0097', '#ec922a', '#0ec28c', ''];

// Add a couple fake annotations to the emulated storage
for (let i: number = 0; i < 10; i++) {
    let newAnnotation: annotation = {
        id: i,
        comment: 'Blam',
        created: new Date(Date.now()),
        colour: colourArray[Math.floor(Math.random() * colourArray.length)],
        userName: 'Sam Reeve',
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

const blamString = `blam blam blam blam blam blam blam blam.
blam blam blam blam blam blam blam blam.
blam blam blam blam blam blam blam blam.
blam blam blam blam blam blam blam blam.
blam blam blam blam blam blam blam blam.
blam blam blam blam blam blam blam blam.`

createCardContainer();