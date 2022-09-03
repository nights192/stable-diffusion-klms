const maxSeedVal = 4294967295;

export function fetchHost() {
    const val = process.env.REACT_APP_SERVER;

    return (val !== undefined) ? val : "127.0.0.1:8000";
}

export function genRandomSeed() {
    return Math.floor(Math.random() * maxSeedVal);
}