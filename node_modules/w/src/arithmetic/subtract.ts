import { checkStrings } from '../util/check-strings';
/**
 * Subtract the first number from the second
 * @export
 * @param {number} a The from which to subtract
 * @param {number} b The number to subtract
 * @param {boolean} [strict] Throw an error if the parameters are not numbers or valid number strings
 * @returns {number} 
 * 
 * @usage
 * 
 */
export function subtract(a: number | string, b: number | string, strict?: boolean): number {
    if (strict) checkStrings(a, b);
    return +a - +b;
}

/**
 * Subtract the smaller parameter from the larger, always resulting in a 0 or positive number.
 * @export
 * @param {(number | string)} a number from which to subtract
 * @param {(number | string)} b number from which to subtract
 * @param {boolean} [strict] Throw an error if the parameters are not numbers or valid number strings
 * @returns {number} 
 */
export function subtractSmallerFromLarger(a: number | string, b: number | string, strict?: boolean): number {
    if (strict) checkStrings(a, b);
    return +a > +b ? +b - +a : +a - +b;
}

/**
 * Subtract the larger parameter from the smaller, always resulting in a 0 or negative number.
 * @export
 * @param {(number | string)} a number from which to subtract
 * @param {(number | string)} b number from which to subtract
 * @param {boolean} [strict] Throw an error if the parameters are not numbers or valid number strings
 * @returns {number} 
 */
export function subtractLargerFromSmaller(a: number | string, b: number | string, strict?: boolean): number {
    if (strict) checkStrings(a, b);
    return +a > +b ? +a - +b : +b - +a;
}