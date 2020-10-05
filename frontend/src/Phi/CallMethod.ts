export default (method: string, ...args: any[]) => {
    return <C extends { new(...args: any[]): Object, [index: string]: any }>(obj: C, property: string): void => {
        obj[property][method](...args);
    };
};