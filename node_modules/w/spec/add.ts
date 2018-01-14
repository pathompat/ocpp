import 'jasmine';
import { add } from '../src/arithmetic/add';

describe('add', () => {
    it('should add numbers as a spread operator', () => {
        expect(add(2, 65, 4, 7, 75, 58)).toEqual(211);
    });

    it('should treat number strings as numbers', () => {
        expect(add('2', '65', '4', '7', '75', '58')).toEqual(211);
    });

    it('should allow numbers and strings to be mixed in randomly', () => {
        expect(add('2', 65, 4, '7', '75', 58)).toEqual(211);
    });

    it('should treat non-number strings as 0', () => {
        expect(add('hello', '2', 65, 'world', 4, '7', '75', 'foo', 58)).toEqual(211);
    });

    it('should throw for non-number parameters', () => {
        expect(add('hello', '2', 65, 'world', 4, '7', '75', 'foo', 58));
    });

})