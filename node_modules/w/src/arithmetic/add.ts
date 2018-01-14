/**
 * Sum of a series of numbers or number strings.
 * The numbers are provided as arguments to the `add` method.
 * 
 * @export
 * @param {(...(number | string)[])} args the numbers that need to be added
 * @returns {number} 
 */
export function add(...args: (number | string)[]): number {
    let l = args.length;
    let i = 0;
    while (l--) {
        i += +args[l] | 0;
    }
    return i;
}

/**
 * Sum an array of numbers or number strings.
 * The numbers are provided as arguments to the `add` method.
 * 
 * @export
 * @param {((number | string)[])} args the numbers that need to be added
 * @returns {number} 
 * @hidden
 */
export function addArray(args: (number | string)[]): number {
    let l = args.length;
    let i = 0;
    while (l--) {
        i += +args[l] | 0;
    }
    return i;
}

