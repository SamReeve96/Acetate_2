// Nullable object checker (For typescript Vs. e.g. Document object)
export function checkNullableObject(nullableObject: any): any {
    if (nullableObject === null) {
        console.error('Object was found to be null, it cant be: ', nullableObject);
    } else {
        return nullableObject;
    }
}