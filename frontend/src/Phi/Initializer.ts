export default function initializer(callback: <T extends Object>(target: T, property: keyof T) => void) {
	return function (target: Object, property: string) {
		callback(target, property as keyof typeof target);
	};
}

// function runMethod<T extends Record<M, () => void>, M extends keyof T>(obj: T, method: M) {
//     obj[method]();
// }
// function createInstance<A extends Object>(c: new () => A): A {
//     return new c();
// }