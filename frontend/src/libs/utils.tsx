const maxSeedVal = 4294967295;

export function genRandomSeed() {
    return Math.floor(Math.random() * maxSeedVal);
}