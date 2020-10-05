export {};

declare global {
	interface Object {
		equals(o: Object): boolean;
	}
}
Object.prototype.equals = function (o: any): boolean {
	return this == o;
};
declare global {
	interface Array<T> {
		equals(obj: Object): boolean;

		contains(obj: Object): boolean;
		containsIf(predicate: (e: T) => boolean): boolean;

		indexOf(obj: Object | null, from?: number): number;
		indexIf(predicate: (e: T) => boolean, from?: number): number;
		lastIndexOf(obj: Object | null, from?: number): number;
		lastIndexIf(predicate: (e: T) => boolean, from?: number): number;

		first(): T;
		last(): T;
		at(index: number): T;
		from(index: number, count: number): T[];
		range(index: number, until: number): T[];

		pushFront(obj: T): void;
		addAt(index: number, obj: T): void;
		addAllAt<W extends T>(index: number, arr: W[]): void;

		replace(index: number, obj: T): T;
		replaceAll(unaryOperator: (e: T) => T): void;

		removeFirst(): T;
		removeLast(): T;
		remove(obj: Object): boolean;
		removeAt(index: number): T;
		removeFrom(index: number, count: number): T[];
		removeRange(index: number, until: number): T[];
		clear(): void;
	}
}
Array.prototype.equals = function (o: any): boolean {
	if (!(o instanceof Array) || this.length != o.length) {
		return false;
	}
	for (let i = 0; i < this.length; i++) {
		if (this[i] != o[i]) {
			return false;
		}
	}
	return true;
};

Array.prototype.contains = function (obj: any): boolean {
	for (const e of this) {
		if (e == obj) {
			return true;
		}
	}
	return false;
};
Array.prototype.containsIf = function (predicate: (e: any) => boolean): boolean {
	for (const e of this) {
		if (predicate(e)) {
			return true;
		}
	}
	return false;
};

// Array.prototype.indexOf = function (obj: any, index = 0): number {
// 	if (index < 0 || this.length <= index) {
// 		throw new RangeError(`Index out of the range`);
// 	}
// 	for (; index < this.length; index++) {
// 		if (this[index] == obj) {
// 			return index;
// 		}
// 	}
// 	return -1;
// };
Array.prototype.indexIf = function (predicate: (e: any) => boolean, index = 0): number {
	if (index < 0 || this.length <= index) {
		throw new RangeError(`Index out of the range`);
	}
	for (; index < this.length; index++) {
		if (predicate(this[index])) {
			return index;
		}
	}
	return -1;
};
Array.prototype.lastIndexOf = function (obj: any, index: number): number {
	index = index ?? this.length - 1;
	if (index < 0 || this.length <= index) {
		throw new RangeError(`Index out of the range`);
	}
	for (; index >= 0; index--) {
		if (this[index] == obj) {
			return index;
		}
	}
	return -1;
};
Array.prototype.lastIndexIf = function (predicate: (e: any) => boolean, index: number): number {
	index = index ?? this.length - 1;
	if (index < 0 || this.length <= index) {
		throw new RangeError(`Index out of the range`);
	}
	for (; index >= 0; index--) {
		if (predicate(this[index])) {
			return index;
		}
	}
	return -1;
};

Array.prototype.first = function (): any {
	return this.at(0);
};
Array.prototype.last = function (): any {
	return this.at(this.length - 1);
};
Array.prototype.at = function (index: number): any {
	if (index < 0 || this.length <= index) {
		throw new RangeError(`Index out of the range`);
	}
	return this[index];
};
Array.prototype.from = function (index: number, count: number): any[] {
	if (index < 0 || count < 0 || this.length < index + count) {
		throw new RangeError(`Index out of the range`);
	}
	return this.slice(index, count);
};
Array.prototype.range = function (index: number, until: number): any[] {
	return this.from(index, until - index);
};

Array.prototype.pushFront = function (obj: any): void {
	this.splice(0, 0, obj);
};
Array.prototype.addAt = function (index: number, obj: any): void {
	if (index < 0 || this.length < index) {
		throw new RangeError(`Index out of the range`);
	}
	this.splice(index, 0, obj);
};
Array.prototype.addAllAt = function (index: number, arr: any[]): void {
	if (index < 0 || this.length < index) {
		throw new RangeError(`Index out of the range`);
	}
	this.splice(index, 0, ...arr);
};

Array.prototype.replace = function (index: number, obj: any): any {
	const result = this.at(index);
	this[index] = obj;
	return result;
};
Array.prototype.replaceAll = function (unaryOperator: (e: any) => any): void {
	for (let i = this.length - 1; i >= 0; i--) {
		this[i] = unaryOperator(this[i]);
	}
};

Array.prototype.removeFirst = function (): any {
	return this.removeAt(0);
};
Array.prototype.removeLast = function (): any {
	return this.removeAt(this.length - 1);
};
Array.prototype.remove = function (obj: any): boolean {
	for (let i = this.length - 1; i >= 0; i--) {
		if (this[i] == obj) {
			this.splice(i, 1);
			return true;
		}
	}
	return false;
};
Array.prototype.removeAt = function (index: number): any {
	if (index < 0 || this.length <= index) {
		throw new RangeError(`Index out of the range`);
	}
	return this.splice(index, 1)[0];
};
Array.prototype.removeFrom = function (index: number, count: number): any[] {
	if (index < 0 || count < 0 || this.length < index + count) {
		throw new RangeError(`Index out of the range`);
	}
	return this.splice(index, count);
};
Array.prototype.removeRange = function (index: number, until: number): any[] {
	return this.removeFrom(index, until - index);
};
Array.prototype.clear = function (): void {
	this.splice(0, this.length);
};

declare global {
	interface Map<K, V> {
		isEmpty(): boolean;
		notEmpty(): boolean;

		getOrPut(k: K, f: (k: K) => V): V;

		remove(k: K): V | null;
		poll(): V;
	}
}
Map.prototype.isEmpty = function (): boolean {
	return this.size == 0;
};
Map.prototype.notEmpty = function (): boolean {
	return this.size > 0;
};
Map.prototype.getOrPut = function (k: Object, fn: (k: Object) => Object): Object | undefined {
	let result = this.get(k);
	if (!result) {
		result = fn(k);
		this.set(k, result);
	}
	return result;
};
Map.prototype.remove = function (k: Object): Object | undefined {
	let result = this.get(k);
	if (result) {
		this.delete(k);
	}
	return result;
};
Map.prototype.poll = function () {
	if (this.size == 0) {
		throw new RangeError('Index out of range');
	}
	for (const key of this.keys()) {
		return this.remove(key);
	}
};