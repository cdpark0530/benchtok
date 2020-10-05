import "./LinearLayout.scss";
import "./Extensions";

import initializer from "./Initializer";

declare global {
	interface HTMLCollection extends Array<LinearLayout> {
		length: number;

		push(...items: LinearLayout[]): never;
		pushFront(o: LinearLayout): never;
		addAt(i: number, o: LinearLayout): never;
		addAllAt<W extends LinearLayout>(i: number, a: W[]): never;

		removeFirst(): never;
		removeLast(): never;
		remove(o: Object): never;
		removeAt(i: number): never;
		removeFrom(i: number, count: number): never;
		removeRange(i: number, until: number): never;
		clear(): never;

		pop(): never;
		splice(start: number, count: number, ...items: LinearLayout[]): never;
		fill(value: LinearLayout, start?: number, end?: number): never;
		copyWithin(target: number, start: number, end?: number): never;
		shift(): never;
		unshift(...items: LinearLayout[]): never;
		reverse(): never;
		flat(): void;
		reduce(callback: (previousValue: LinearLayout, currentValue: LinearLayout, currentIndex: number, array: LinearLayout[]) => LinearLayout, initialValue?: LinearLayout): never;
		reduceRight(callback: (previousValue: LinearLayout, currentValue: LinearLayout, currentIndex: number, array: LinearLayout[]) => LinearLayout, initialValue?: LinearLayout): never;
		join(separator?: string): never;
		sort(compare?: (a: LinearLayout, b: LinearLayout) => number): never;
		[Symbol.iterator](): IterableIterator<LinearLayout>;
		[index: number]: LinearLayout;
	}
}
for (const key of Object.getOwnPropertyNames(Array.prototype)) {
	key != "length" && (HTMLCollection.prototype[key as keyof Array<LinearLayout>] = Array.prototype[key as keyof Array<LinearLayout>]);
}

/**
 * Note that LinearLayout can be called View as it is the root element of all custom element classes in this library.
 *
 * # Implementation note
 * You should uncomment the code in the decorator of LinearLayout.domObserver if you are not using any dynamic DOM builder like React or Vue.
 * The code in the decorator is the fallback for applications that don't use any dynamic DOM builder, so it will fire the initial onCreate
 * of elements under the body element.
 *
 * # Life cycles methods
 * View has five life cycle methods: onCreate, onLayout, (onScroll), onDraw, onHide, onDestroy.
 * The life cycle methods are called in several api callbacks and methods assuming that the nodes(elements) are View.
 * There is the only one exception that it treats as a corner case which is body element as Chrome resets it
 * whenever you try to change it to another element.
 *
 * # A quirk in the implementation
 * onLayout will mostly be called twice as initialization. This is because LinearLayout will call onRequestLayout of its children
 * after calling onCreate of them to make sure at least one requestLayout call. The fallback is for the case when ResizeObserver
 * does not call the initial requestLayout when you delay the process until load event. Based on the observation, it is presumed
 * that ResizeObserver uses requestAnimationFrame to trigger its callback.
 *
 * # requestLayout and requestDraw
 * You should call onLayout and onDraw via requestLayout and requestDraw respectively. Even if you call or trigger any of them
 * in onCreate, it will be ignored with two locks - layoutLock and drawLock. They are initially on and until View calls
 * requestLayout for the first time to ignore any requestLayout call that might be triggered by addView or removeView.
 * onRequestLayout - the callback method of requestLayout for requestAnimationFrame - turns off its lock and then calls onLayout
 * and then onRequestDraw which turns off its lock and calls onDraw. So calling any of them in onLayout will have no effect.
 * You can trigger any of them in onDraw, but you should put a condition to trigger it or it will have an infinite loop.
 *
 * # Scroll
 * View is listening to the scroll event by default, and the callback is onScrollInternal which calls onScroll; and onDraw if the lock is off.
 *
 * # The reason that it is implemented with MutationObserver
 * It is because of the irregular order of initialization by user agencies as described below.
 * ## The order in which Chrome initialises DOM elements
 * 1. Chrome calls the constructor and connectedCallback of each node first in the definition order of nodes and second in the "dfs" order of nodes.
 *    Thus the parent View or a child View of a View might be still HTMLElement when it is initialised.
 * 2. When a sub tree gets disconnected or connected,
 *    Chrome calls the disconnectedCallback or the connectedCallback of each node in the "dfs" order of nodes.
 *    On the other hand, when a connected sub tree gets disconnected and then connected right away like via calling appendChild on another node,
 *    Chrome calls the disconnectedCallback and connectedCallback in a row of each node in the "dfs" order of nodes.
 *
 * # The order in which each event occurs
 * 1. document.readyState == "loading"
 * 2. document.readyState == "interactive"
 * 3. DOMContentLoaded event
 * 4. ResizeObserver
 * 5. document.readyState == "complete"
 * 6. load event
 */
class LinearLayout extends HTMLElement {
	public static define<N extends keyof LinearLayout.Tag2Class, C extends new () => LinearLayout>(name: N, cls: C): void {
		customElements.define(name, cls);
	}
	public static create<N extends keyof LinearLayout.Tag2Class>(name: N): LinearLayout.Tag2Class[N] {
		return document.createElement(name) as LinearLayout.Tag2Class[N];
	}
	public static select<N extends keyof LinearLayout.Tag2Class>(name: N): LinearLayout.Tag2Class[N] {
		return document.getElementsByTagName(name) as unknown as LinearLayout.Tag2Class[N];
	}


	public static passiveSupport = false;
	private static width = 0;
	private static height = 0;
	@initializer(() => {
		document.addEventListener("readystatechange", () => {
			LinearLayout.state = LinearLayout.State[document.readyState];
			console.log(document.readyState);
		});

		function onResize(): void {
			LinearLayout.width = window.innerWidth;
			LinearLayout.height = window.innerHeight;
		}
		LinearLayout.listen("resize", onResize);

		LinearLayout.onDomLoaded(() => {
			LinearLayout.state = LinearLayout.State.domLoaded;
			onResize();
			console.log("domLoaded");
		});
		LinearLayout.onLoad(() => {
			LinearLayout.state = LinearLayout.State.loaded;
			console.log("loaded");
		});
		try {
			const options = {
				get passive() {
					LinearLayout.passiveSupport = true;
					return false;
				}
			};

			// @ts-ignore
			window.addEventListener("test", null, options);
			// @ts-ignore
			window.removeEventListener("test", null, options);
		}
		catch (e) {
			LinearLayout.passiveSupport = false;
		}
	})
	public static listen<K extends keyof WindowEventMap>(type: K, listener: (this: Window, event: WindowEventMap[K]) => any, options?: AddEventListenerOptions): void {
		window.addEventListener(type, listener, LinearLayout.passiveSupport ? {passive: true, ...options} : options?.capture);
	}


	public static State = {
		loading: 0,
		interactive: 1,
		domLoaded: 2,
		complete: 3,
		loaded: 4
	};
	public static state = LinearLayout.State[document.readyState];
	public static onDomLoaded(listener: () => void): void {
		LinearLayout.state > LinearLayout.State.domLoaded ? listener() : window.addEventListener("DOMContentLoaded", listener);
	}
	public static onResLoaded(listener: () => void): void {
		LinearLayout.state > LinearLayout.State.complete ? listener() : document.addEventListener("readystatechange", () => {
			if (document.readyState == "complete") {
				listener();
			}
		});
	}
	public static onLoad(listener: () => void): void {
		LinearLayout.state == LinearLayout.State.loaded ? listener() : window.addEventListener("load", listener);
	}


	public static getVsyncRequester(callback: (time: number, ...args: any[]) => void): (...args: any[]) => void {
		let lock = false;
		return (...args: any[]) => {
			if (lock) {
				return;
			}
			lock = true;

			requestAnimationFrame(time => {
				lock = false;
				callback(time, ...args);
			});
		};
	}
	public static getLazyTimeoutSetter(callback: (...args: any[]) => void, timeout?: number): (...args: any[]) => void {
		let id = 0;
		return (...args: any[]): void => {
			clearTimeout(id);
			id = setTimeout(callback, timeout, ...args);
		};
	}

	public static from(x: number, y: number): LinearLayout | null {
		return document.elementFromPoint(x, y) as LinearLayout;
	}


	public static unit2digit(size: string, unit: string = "px"): number {
		return Number.parseFloat(size.slice(0, -unit.length));
	}


	@initializer(() => {
		LinearLayout.domObserver.observe(document.body, {
			childList: true,
			subtree: true
		});

		// LinearLayout.onDomLoaded(() => {
		// 	for (const element of document.body.children) {
		// 		if (element instanceof View) {
		// 			element.onCreate();
		// 			element.onRequestLayout(0);
		// 		}
		// 	}
		// });
	})
	private static readonly domObserver = new MutationObserver(mutations => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (node instanceof LinearLayout) {
					if (node.layoutLock) { // prevents duplicate initialization when using a dynamic DOM builder
						node.onCreate();
						node.onRequestLayout(0);
					}
				}
			}
			for (const node of mutation.removedNodes) {
				if (node instanceof LinearLayout) {
					node.onDestroy();
				}
			}
		}
	});
	private static readonly resizeObserver = new ResizeObserver(entries => {
		for (const entry of entries) {
			const view = entry.target as LinearLayout; // assuming
			view.offsetParent == null ? view.onHide() : view.onRequestLayout(0);
		}
	});


	private layoutLock: boolean = true;
	private drawLock: boolean = true;
	protected parentView?: LinearLayout;

	public readonly cs: CSSStyleDeclaration = globalThis.getComputedStyle(this);
	// @ts-ignore
	public rect: DOMRectReadOnly;
	public ot: LinearLayout.Orientation = "y";

	public constructor() {
		super();

		this.onRequestLayout = this.onRequestLayout.bind(this);
		this.onRequestDraw = this.onRequestDraw.bind(this);

		this.listen("scroll", this.requestScroll);
	}


	protected onCreate(): void {
		LinearLayout.resizeObserver.observe(this);
		this.parentView = this.parentElement instanceof LinearLayout ? this.parentElement : undefined;

		this.ot = this.getAttribute("orientation") as LinearLayout.Attrs["orientation"] ?? "y";
		if (this.ot != "x" && this.ot != "y") {
			throw new TypeError("Invalid orientation type");
		}

		for (const child of this) {
			child.onCreate();
			child.onRequestLayout(0);
		}
	}
	protected onDestroy(): void {
		this.layoutLock = this.drawLock = true;
		LinearLayout.resizeObserver.unobserve(this);
		this.parentView = undefined;

		for (const child of this) {
			child.onDestroy();
		}
	}


	protected requestLayout(): void {
		if (this.layoutLock || this.isHidden()) {
			return;
		}
		this.layoutLock = this.drawLock = true;
		requestAnimationFrame(this.onRequestLayout);
	}
	private onRequestLayout(time: number, rect?: DOMRectReadOnly): void {
		this.onLayout(rect ? rect : this.getBoundingClientRect());
		this.layoutLock = false;
		this.parentView && this.parentView.onChildLayout(this);
		requestAnimationFrame(this.onRequestDraw);
	}
	protected onLayout(rect: DOMRectReadOnly): void {
		this.rect = rect;
	}
	// called to get the up to date rect in case the view has moved by scrolling
	public updateLayout(): void {
		this.rect = this.getBoundingClientRect();
	}


	protected requestScroll(): void {
		this.onScroll();
		this.parentView!.onChildScroll(this); // assume
		this.drawLock || this.onRequestDraw();
	}
	protected onScroll(): void {}


	protected requestDraw(): void {
		if (this.drawLock || this.isHidden()) {
			return;
		}
		this.drawLock = true;
		requestAnimationFrame(this.onRequestDraw);
	}
	private onRequestDraw(): void {
		this.drawLock = false;
		this.onDraw();
	}
	protected onDraw(): void {}


	public isHidden(): boolean {
		return this.offsetParent == null;
	}
	protected onHide(): void {}


	public *[Symbol.iterator](): Generator<LinearLayout, any, undefined> {
		for (let i = 0; i < this.children.length; i++) {
			yield this.children.at(i);
		}
	}

	public nonEmpty(): boolean {
		return this.children.length > 0;
	}
	public count(): number {
		return this.children.length;
	}
	public contains(view: LinearLayout): boolean {
		return this.children.contains(view);
	}
	public at(index: number): LinearLayout {
		return this.children.at(index);
	}
	public first(): LinearLayout {
		return this.children.first();
	}
	public last(): LinearLayout {
		return this.children.last();
	}

	public addView(view: LinearLayout): void {
		this.addViewInternal(view, null);
	}
	public addViewFront(view: LinearLayout): void {
		this.addViewInternal(view, this.count() == 0 ? null : this.children.first());
	}
	public addViewAt(view: LinearLayout, index: number): void {
		this.addViewInternal(view, this.children.at(index));
	}
	public addViewBefore(view: LinearLayout, before: LinearLayout | null): void {
		this.addViewInternal(view, before);
	}
	private addViewInternal(view: LinearLayout, before: LinearLayout | null): void {
		if (this.children.contains(view)) {
			throw new Error(`${view} has already been in the View.Group ${this}`);
		}
		this.insertBefore(view, before);
		this.onAddView(view);
		this.onScroll();
		this.requestDraw();
	}
	protected onAddView(child: LinearLayout): void {}

	public removeView(view: LinearLayout): void {
		this.removeViewInternal(view);
	}
	public removeViewAt(index: number): void {
		this.removeViewInternal(this.at(index));
	}
	public removeAllViews(): void {
		while (this.nonEmpty()) {
			this.removeViewInternal(this.first());
		}
	}
	private removeViewInternal(view: LinearLayout): void {
		this.onRemoveView(view);
		this.removeChild(view);
		this.onScroll();
		this.requestDraw();
	}
	protected onRemoveView(child: LinearLayout): void {}


	public onChildLayout(child: LinearLayout): void {}

	public onChildScroll(child: LinearLayout): void {}


	protected onClick(event: MouseEvent): void {}
	protected onEnter(event: MouseEvent): void {}
	protected onLeave(event: MouseEvent): void {}


	public listen<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: AddEventListenerOptions): void {
		super.addEventListener(type, listener, LinearLayout.passiveSupport ? {passive: true, ...options} : options?.capture);
	}
	public ignore<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: EventListenerOptions): void {
		super.removeEventListener(type, listener, LinearLayout.passiveSupport ? {...options} : options?.capture);
	}


	public get width(): number {
		return this.rect.width;
	}
	public get height(): number {
		return this.rect.height;
	}
	public getSize(axis: LinearLayout.Orientation = "x", v: LinearLayout = this): number {
		return this.rect[v.ot == axis ? "width" : "height"];
	}
	public setSize(size: string, axis: LinearLayout.Orientation = "x", v: LinearLayout = this): void {
		this.style[v.ot == axis ? "width" : "height"] = size;
	}


	public getStart(axis: LinearLayout.Orientation = "x", v: LinearLayout = this): number {
		return this.rect[v.ot == axis ? "left" : "top"];
	}
	public getEnd(axis: LinearLayout.Orientation = "x", v: LinearLayout = this): number {
		return this.rect[v.ot == axis ? "right" : "bottom"];
	}


	public setStart(offset: string, axis: LinearLayout.Orientation = "x", v: LinearLayout = this): void {
		this.style[v.ot == axis ? "left" : "top"] = offset;
	}
	public setEnd(offset: string, axis: LinearLayout.Orientation = "x", v: LinearLayout = this): void {
		this.style[v.ot == axis ? "right" : "bottom"] = offset;
	}


	public scrollOn(d: number, axis: LinearLayout.Orientation = "x", v: LinearLayout = this): void {
		v.ot == axis ? this.scrollBy(d, 0) : this.scrollBy(0, d);
	}


	public isIntersecting(view: LinearLayout): boolean {
		if (this.rect.left <= view.rect.left) {
			if (this.rect.right <= view.rect.left) {
				return false;
			}
		}
		else if (view.rect.right <= this.rect.left) {
			return false;
		}

		if (this.rect.top <= view.rect.top) {
			if (this.rect.bottom <= view.rect.top) {
				return false;
			}
		}
		else if (view.rect.bottom <= this.rect.top) {
			return false;
		}

		return true;
	}


	public getOuterWidth(): number {
		return this.width + this.getMarginLeft() + this.getMarginRight();
	}
	public getMarginLeft(): number {
		return Number.parseFloat(this.cs.marginLeft.slice(0, -2));
	}
	public getMarginRight(): number {
		return Number.parseFloat(this.cs.marginRight.slice(0, -2));
	}
	public getOuterHeight(): number {
		return this.height + this.getMarginTop() + this.getMarginBottom();
	}
	public getMarginTop(): number {
		return Number.parseFloat(this.cs.marginTop.slice(0, -2));
	}
	public getMarginBottom(): number {
		return Number.parseFloat(this.cs.marginBottom.slice(0, -2));
	}

	public getInnerWidth(): number {
		return this.width - this.getPaddingLeft() - this.getPaddingRight();
	}
	public getPaddingLeft(): number {
		return Number.parseFloat(this.cs.paddingLeft.slice(0, -2));
	}
	public getPaddingTop(): number {
		return Number.parseFloat(this.cs.paddingTop.slice(0, -2));
	}
	public getPaddingStart(axis: LinearLayout.Orientation = "x", v: LinearLayout = this): number {
		return v.ot == axis ? this.getPaddingLeft() : this.getPaddingTop();
	}

	public getInnerHeight(): number {
		return this.height - this.getPaddingTop() - this.getPaddingBottom();
	}
	public getPaddingRight(): number {
		return Number.parseFloat(this.cs.paddingRight.slice(0, -2));
	}
	public getPaddingBottom(): number {
		return Number.parseFloat(this.cs.paddingBottom.slice(0, -2));
	}
	public getPaddingEnd(axis: LinearLayout.Orientation = "x", v: LinearLayout = this): number {
		return v.ot == axis ? this.getPaddingRight() : this.getPaddingBottom();
	}

	public getPointer(event: PointerEvent, axis: LinearLayout.Orientation = "x"): number {
		return this.ot == axis ? event.clientX : event.clientY;
	}
}

namespace LinearLayout {
	export interface Attrs {
		orientation?: Orientation;
		position?: Position;
	}
	export type Orientation = "x" | "y";
	export type Position = "abs" | "fixed";
	export interface Tag2Class {
		"linear-layout": LinearLayout;
	}
}

LinearLayout.define("linear-layout", LinearLayout);

export default LinearLayout;
export {LinearLayout};

// @ts-ignore
window.LinearLayout = LinearLayout;

declare global {
	interface WindowEventMap {
		"DOMContentLoaded": Event;
	}
}