function dotProduct(vectorA: number[], vectorB: number[]): number | null {
    if (vectorA.length !== vectorB.length) {
        console.error("Vectors must be of the same length");
        return null;
    }

    return vectorA.reduce((sum, value, index) => sum + value * vectorB[index], 0);
}

// Example usage:
const vectorA = [1, 2, 3];
const vectorB = [4, 5, 6];
const result = dotProduct(vectorA, vectorB);
console.log(result); // Output: 32