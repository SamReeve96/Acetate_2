
import React, { ReactElement } from 'react';
import ReactDOM from 'react-dom';
import { annotation} from './customTypes';
import { checkNullableObject } from './shared';
import { msgSubjects } from '../../global/messageSubjects';

const blamString = `blam blam blam blam blam blam blam blam.
blam blam blam blam blam blam blam blam.
blam blam blam blam blam blam blam blam.
blam blam blam blam blam blam blam blam.
blam blam blam blam blam blam blam blam.
blam blam blam blam blam blam blam blam.`

const emulatedStorageAnnotations: annotation[] = [];

const colourArray: string[] = ['#6c0097', '#ec922a', '#0ec28c', ''];

// Add a couple fake annotations to the emulated storage
for (let i = 0; i < 10; i++) {
    const newAnnotation: annotation = {
        id: i,
        comment: 'Blam',
        created: new Date(Date.now()),
        colour: colourArray[Math.floor(Math.random() * colourArray.length)],
        userName: 'Sam Reeve',
        userProfileURL: ''
    }
    emulatedStorageAnnotations.push(newAnnotation);
}

function initialize(): void {
    checkNullableObject(document.body.insertAdjacentHTML('afterbegin',
        '<div id="shadowContainer"></div>'
    ));

    const shadowContainer: HTMLElement = checkNullableObject(document.querySelector('div#shadowContainer'));
    const shadow = shadowContainer.attachShadow({ mode: 'open' });

    // Render react components inside shadow dom
    ReactDOM.render(
        <CardsContainer
            storageAnnotations={emulatedStorageAnnotations}
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

// ========================
// React components
// ========================

function CardsContainer(props: any): ReactElement {
    const [annotations, setAnnotations] = React.useState(props.storageAnnotations as annotation[]);

    const newAnnotation: annotation = {
        id: annotations.length,
        comment: blamString,
        created: new Date(Date.now()),
        colour: colourArray[Math.floor(Math.random() * colourArray.length)],
        userProfileURL: '',
        userName: 'Test Name'
    }

    // Similar to componentDidMount and componentDidUpdate:
    React.useEffect(() => {
        // Update the document title using the browser API
        document.title = `There are: ${annotations.length} annotations`;
    }, [annotations]);

    function addDummyAnnotation(): void {
        setAnnotations(annotations.concat([newAnnotation]));
    }

    function deleteAnnotation(annotationId: number): void{
        const deleteConfirmed: boolean = window.confirm('Are you sure you want to delete this annotation?');
        if (deleteConfirmed) {
            const annotationsClone: annotation[] = annotations.filter(annotation => annotation.id !== annotationId);
            setAnnotations(annotationsClone);
        }
    }

    const cards = annotations.map((annotation) => {
        return (
            <AnnotationCard
                key={annotation.id}
                annotationData={annotation}
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

function AnnotationCard(props: any): ReactElement {
    const [annotationData, setAnnotationData] = React.useState(props.annotationData);
    const [annotationComment, setAnnotationComment] = React.useState(props.annotationData.comment);

    const deleteAnnotation = (annotationId: number): void => props.annotationMethods.deleteAnnotation(annotationId);
    const [editMode, setEditMode] = React.useState(false as boolean);

    function extractInitials(): string{
        const userName = annotationData.userName;
        const matches = checkNullableObject(userName.match(/\b(\w)/g));
        return matches.join('');
    }

    function saveComment(newComment: string): void {
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

//------------
// Begin!
//------------

initialize();