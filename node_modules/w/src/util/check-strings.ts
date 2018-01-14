/**
@private
 */
export function checkStrings(a: number | string, b: number | string): void {
    if ((+a === 0 && a !== '0') || (+b === 0 && b !== '0')) throw new Error('One of your parameters is a non-number string. These are treated as 0 in JavaScript, and may cause trouble in your code.')
}