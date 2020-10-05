import "./ListView.scss";
import ViewScroller from "./ViewScroller";
import LinearLayout from "./LinearLayout";

/**
 * # Usage notes
 * ## About CSS properties
 * It assumes it doesn't have any padding and its children don't have any margin for better performance.
 * Therefore do not set them, or it does not guarantee there will not be any errors.
 *
 * ## About registering an adapter
 * It searches its adapter by its id. You can register an adapter for it via ListView.register.
 */
class ListView extends ViewScroller.Layout implements ListView.Adapter.DataObserver {
	private static adapters = new Map<string, ListView.Adapter>();
	public static register(id: string, adapter: ListView.Adapter): void {
		ListView.adapters.set(id, adapter);
	}
	public static readonly NO_ID = -1;
	public static readonly NO_POSITION = -1;
	public static readonly INVALID_TYPE = -1;

	protected static readonly upperBoundFactor = 1.5;
	protected static readonly lowerBoundFactor = 1.0;
	protected upperBound = 0;
	protected lowerBound = 0;
	protected frontOffset = 0;
	protected concreteOffset = 0;

	// @ts-ignore assumes the client has registered an adapter for this instance
	protected adapter: ListView.Adapter; // count > 0 ? view2holer.size > 0 & type2holder.size > 0 & recycler != null
	protected itemCount = 0;
	protected readonly type2pool = new Map<number, ListView.ViewHolder[]>();
	protected readonly view2holder = new Map<LinearLayout, ListView.ViewHolder>();
	protected pos2size = new Array<number>();
	protected top?: ListView.ViewHolder;
	protected front?: ListView.ViewHolder;

	public constructor() {
		super();

		this.listen("click", this.onClick);
	}

	protected onClick(event: MouseEvent): void {
		// TODO
	}


	protected onCreate(): void {
		super.onCreate();

		this.adapter = ListView.adapters.get(this.id)!;

		this.onAttachAdapter();
	}
	protected onDestroy(): void {
		super.onDestroy();

		this.onDetachAdapter();
	}


	public setAdapter(adapter: ListView.Adapter): void {
		this.onDetachAdapter();

		this.adapter = adapter;

		this.onAttachAdapter();
	}
	protected onDetachAdapter(): void {
		this.adapter.unobserve(this);
	}
	protected onAttachAdapter(): void {
		this.adapter.observe(this);
		this.type2pool.clear();
		this.onItemsChanged();
	}


	protected poll(pos: number): ListView.ViewHolder {
		const type = this.adapter.type(pos);
		const pool = this.type2pool.get(type);

		const holder = pool && pool.length > 0 ? pool.removeLast() : this.adapter.onCreate(type);
		holder.id = this.adapter.id(pos);
		holder.type = type;
		holder.pos = pos;
		this.adapter.onBind(holder);

		return holder;
	}
	protected recycle(holder: ListView.ViewHolder): void {
		this.type2pool.getOrPut(holder.type, t => []).push(holder);
	}

	protected addByPos(pos: number, before: LinearLayout | null): void {
		const holder = this.poll(pos);
		this.view2holder.set(holder.view, holder);
		this.addViewBefore(holder.view, before);
	}
	protected onAddView(child: LinearLayout): void {
		super.onAddView(child);

		if (child == this.first()) {
			const newFront = this.view2holder.get(child)!;
			if (this.front) {
				// when adding the front item, concreteOffset will be the same value,
				// which leads endless addition at front and removal at back. prevent it by adjusting concreteOffset.
				(this.ot == "x" || this.concreteOffset == 0) && this.scrollOn(this.pos2size.at(newFront.pos));
				this.front = newFront;
				this.frontOffset -= (this.pos2size.at(this.front.pos) ?? 0);
			}
			else {
				this.front = this.top = newFront;
			}
		}
	}
	protected onRemoveView(child: LinearLayout): void {
		super.onRemoveView(child);

		const holder = this.view2holder.remove(child)!;
		if (holder == this.front) {
			// when removing the front item on horizontal scroll, concreteOffset will be the same value,
			// which leads endless removal at front and addition at back. prevent it by adjusting concreteOffset.
			this.ot == "x" && this.scrollOn(-this.pos2size.at(holder.pos));
			this.frontOffset += this.pos2size.at(holder.pos);
			this.front = this.view2holder.get(this.children[1]);
		}
		this.recycle(holder);
	}


	public onChildLayout(child: LinearLayout): void {
		super.onChildLayout(child);

		const actual = child.getSize("x", this);
		const holder = this.view2holder.get(child)!;
		const diff = actual - (this.pos2size.at(holder.pos) ?? 0);
		if (diff != 0) {
			this.pos2size[holder.pos] = actual;
			this.setScrollSize(this.getScrollSize() + diff);
		}

		const preCaScrollSize = this.getScrollSize("y");
		const curCaScrollSize = this.setScrollSize(this.scrollSize("y"), "y");

		(diff != 0 || curCaScrollSize != preCaScrollSize) && this.onScrollSizeChanged();
	}

	protected onLayout(rect: DOMRectReadOnly): void {
		super.onLayout(rect);

		const size = this.getSize(); // assume there is no padding
		this.upperBound = size * ListView.upperBoundFactor;
		this.lowerBound = size * ListView.lowerBoundFactor;
	}


	protected onScroll(): void {
		super.onScroll();

		this.concreteOffset = this.scrollOffset();
		this.setScrollOffset(this.frontOffset + this.concreteOffset);
		this.setScrollOffset(this.scrollOffset("y"), "y");

		// find top
		let offset = this.concreteOffset;
		const start = this.front!.pos;
		let i = start;
		for (const b = i + this.count(); i < b && i < this.pos2size.length; i++) {
			const size = this.pos2size.at(i);
			if (size == undefined) {
				break;
			}
			offset -= size;
			if (offset < 0) {
				offset += this.pos2size.at(i);
				break;
			}
		}
		this.top = this.view2holder.get(this.at(i - start))!;
	}
	protected onDraw(): void {
		super.onDraw();

		if (this.itemCount <= 0) {
			return;
		}

		if (this.top == null) {
			this.addByPos(0, null);
		}
		else {
			if (this.top.pos > 0) {
				const front = this.front!;
				const pos = this.front!.pos;
				if (this.concreteOffset > this.upperBound) {
					if (this.concreteOffset - this.pos2size.at(pos) > this.lowerBound) {
						this.removeView(front.view);
					}
				}
				else if (this.concreteOffset < this.lowerBound && pos > 0) {
					this.addByPos(pos - 1, front.view);
				}
			}

			const last = this.view2holder.get(this.last())!;
			let pos = last.pos;
			const size = this.pos2size.at(pos);
			const tailOffset = this.scrollSize() - (this.concreteOffset + this.getSize());
			if (tailOffset > this.upperBound) {
				if (tailOffset - size > this.lowerBound) {
					this.removeView(last.view);
				}
			}
			else if (tailOffset < this.lowerBound && ++pos < this.itemCount) {
				this.addByPos(pos, null);
			}
		}
	}


	public onItemsChanged(): void {
		this.removeAllViews();
		this.itemCount = this.adapter.count();
		this.pos2size = new Array(this.itemCount);
		this.virtualScrollWidth = this.virtualScrollX = this.virtualScrollHeight = this.virtualScrollY = this.frontOffset = this.concreteOffset = 0;
		this.front = this.top = undefined;
		this.requestLayout();
	}
	public onItemsAdded(from: number, count: number): void {
		this.itemCount += count;
		this.pos2size.addAllAt(from, new Array(count));

		const vCount = this.count();
		if (vCount == 0 || from > this.front!.pos + vCount) {
			this.requestDraw();
		}
		else {
			const index = from - this.front!.pos;
			if (index > 0) {
				const before = index < vCount ? this.at(index) : null;
				for (let i = from, b = i + count; i < b; i++) {
					this.addByPos(i, before); // triggers requestDraw
				}
			}
		}

		for (const child of this) {
			const holder = this.view2holder.get(child)!;
			holder.pos >= from && (holder.pos += count);
			this.adapter.onBind(holder);
		}
	}
	public onItemsUpdated(from: number, count: number): void {
		const until = from + count;
		for (const holder of this.view2holder.values()) {
			from <= holder.pos && holder.pos < until && this.adapter.onBind(holder); // might trigger onLayout, onChildLayout and onScroll
		}
	}
	public onItemsMoved(from: number, to: number, count: number): void {
		// TODO: subtract the sum of the sizes of moved items before this.front from this.frontOffset, call bind
		const until = from + count;
		if (to == until) {
			return;
		}
		if (until > this.itemCount || from < to && to < until) {
			throw new Error("Invalid arguments");
		}

		if (from < this.front!.pos) {
			let b = until;
			b > this.front!.pos && (b = this.front!.pos);
			for (let i = from; i < b; i++) {
				// TODO
			}
		}
	}
	public onItemsRemoved(from: number, count: number): void {
		const until = from + count;
		if (this.count() == 0 || until > this.itemCount) {
			throw new Error("Invalid arguments");
		}
		(this.itemCount = this.adapter.count()) == 0 && (this.top = undefined);

		const front = this.front!;
		const frontPos = front.pos;
		const lastPos = front.pos + this.count();
		this.front = undefined; // for onRemoveView
		for (let i = until - 1; i >= from; i--) {
			const size = this.pos2size.at(i) ?? 0;
			this.setScrollSize(this.getScrollSize() - size);
			if (i < frontPos) {
				this.frontOffset -= size;
			}
			else if (i < lastPos) {
				this.removeView(this.at(i - frontPos));
			}
		}
		this.pos2size.removeFrom(from, count);
		for (const child of this) {
			const holder = this.view2holder.get(child)!;
			holder.pos > from && (holder.pos -= count);
			this.adapter.onBind(holder);
		}

		this.onScrollSizeChanged();
		if (this.count() > 0) {
			this.front = this.view2holder.get(this.first())!;
			this.requestScroll();
		}
	}
}

namespace ListView {
	export interface Attrs extends ViewScroller.ScrollLayout.Attrs {
	}
	export class ViewHolder {
		public readonly view: LinearLayout;

		/**
		 * Attributes below should be set only by RecyclerView, Adapter and Recycler
		 */
		public id = ListView.NO_ID;
		public type = ListView.INVALID_TYPE;
		public pos = ListView.NO_POSITION;

		constructor(view: LinearLayout) {
			this.view = view;
		}
	}

	export abstract class Adapter<H extends ListView.ViewHolder = ListView.ViewHolder> {
		protected readonly observer: Adapter.DataObserver[] = [];

		public abstract count(): number;
		public id(pos: number): number {
			return pos;
		}
		public type(pos: number): number {
			return 0;
		}
		public abstract onCreate(type: number): H;
		public abstract onBind(holder: H): void;

		/**
		 * Methods below should not be overridden.
		 */
		public observe(observer: Adapter.DataObserver): void {
			if (!this.observer.contains(observer)) {
				this.observer.push(observer);
			}
		}
		public unobserve(observer: Adapter.DataObserver): void {
			this.observer.remove(observer);
		}
		public notifyItemsChanged(): void {
			for (const observer of this.observer) {
				observer.onItemsChanged();
			}
		}
		public notifyItemsAdded(from: number, count: number): void {
			for (const observer of this.observer) {
				observer.onItemsAdded(from, count);
			}
		}
		public notifyItemsUpdated(from: number, count: number): void {
			for (const observer of this.observer) {
				observer.onItemsUpdated(from, count);
			}
		}
		public notifyItemsMoved(from: number, to: number, count: number): void {
			for (const observer of this.observer) {
				observer.onItemsMoved(from, to, count);
			}
		}
		public notifyItemsRemoved(from: number, count: number): void {
			for (const observer of this.observer) {
				observer.onItemsRemoved(from, count);
			}
		}
	}

	export namespace Adapter {
		export interface DataObserver {
			onItemsChanged(): void;
			onItemsAdded(from: number, count: number): void;
			onItemsUpdated(from: number, count: number): void;
			onItemsMoved(from: number, to: number, count: number): void;
			onItemsRemoved(from: number, count: number): void;
		}
	}
}

LinearLayout.define("list-view", ListView);

export default ListView;
export {ListView};

declare module "./LinearLayout" {
	namespace LinearLayout {
		interface Tag2Class {
			"list-view": ListView;
		}
	}
}