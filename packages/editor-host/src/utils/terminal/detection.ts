type MatchTarget = RegExp | string;

function matchAll(...targets: MatchTarget[]) {
    return (content: string) => {
        return targets.every(v => typeof v === 'string' ? content.includes(v) : v.test(content));
    };
}

const longRunningCommandFeatures = [
    // Vite
    //  VITE v6.1.0  ready in 272 ms

    //  ➜  Local:   http://localhost:5173/
    //  ➜  Network: use --host to expose
    //  ➜  press h + enter to show help
    matchAll('VITE', 'Local:'),
    // create-react-app & most webpack-dev-server
    // Starting the development server...
    // Compiled successfully!
    //
    // You can now view here in the browser.
    //
    //   Local:            http://localhost:3000
    //   On Your Network:  http://172.21.244.83:3000
    //
    // Note that the development build is not optimized.
    // To create a production build, use npm run build.
    //
    // webpack compiled successfully
    matchAll('Starting the development server'),
];

export function isLongRunningCommand(content: string) {
    return longRunningCommandFeatures.some(v => v(content));
}
