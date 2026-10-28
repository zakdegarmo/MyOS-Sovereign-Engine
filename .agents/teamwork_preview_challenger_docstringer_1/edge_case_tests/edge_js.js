/**
 * A simple arrow function that takes two arguments, $a$ and $b$, and returns their sum.
 */
const simpleArrow = (a, b) => a + b;

/**
 * This asynchronous handler retrieves an ID from the request body and multiplies it by two before returning the result.
 */
export const asyncExportedArrow = async (req, res) => {
        /**
     * This function takes one numeric input and returns that value doubled by multiplying it by two.
     */
    const helper = (x) => x * 2;
    return helper(req.body.id);
};

/**
 * Creates and returns a specialized function that adds a fixed value to its argument, where the fixed value is determined when the outer function is called.
 */
function regularJsFunction(param1) {
        /**
     * This function accepts one argument and returns the sum of that argument with an externally scoped variable named param1. It serves as a simple accumulator for adding a fixed offset to an input value.
     */
    const innerArrow = (y) => {
        return y + param1;
    };
    return innerArrow;
}

/**
 * Existing JSDoc comment
 */
function existingJsDocFunction() {
    return 42;
}
