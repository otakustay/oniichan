declare module '*.png' {
    const data: string;
    export default data;
}

declare const process: {
    env: {
        NODE_ENV: 'development' | 'production';
    };
};
