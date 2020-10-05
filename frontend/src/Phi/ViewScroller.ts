import "./ViewScroller.scss";
import LinearLayout from "./LinearLayout";

class ViewScroller extends LinearLayout {
	protected xTrack: ViewScroller.Track = LinearLayout.create("scroller-track");
	protected yTrack: ViewScroller.Track = LinearLayout.create("scroller-track");
	protected layout?: ViewScroller.Layout;

	protected onCreate(): void {
		super.onCreate();

		this.xTrack.setAttribute("orientation", "x");
		this.contains(this.xTrack) || this.addViewFront(this.xTrack);
		this.contains(this.yTrack) || this.addViewFront(this.yTrack);
		this.layout = this.children.find(child => child instanceof ViewScroller.Layout) as ViewScroller.Layout;
	}

	public onChildLayout(child: LinearLayout): void {
		super.onChildLayout(child);

		if (this.layout) {
			this.xTrack.onSizeChanged(this.layout.width, this.layout.virtualScrollWidth, this.layout.virtualScrollX);
			this.yTrack.onSizeChanged(this.layout.height, this.layout.virtualScrollHeight, this.layout.virtualScrollY);
		}
	}

	public onChildScroll(child: LinearLayout): void {
		super.onChildScroll(child);

		if (child == this.layout) {
			this.layout.width < this.layout.virtualScrollWidth && this.xTrack.onLayoutScroll(this.layout.virtualScrollX);
			this.layout.height < this.layout.virtualScrollHeight && this.yTrack.onLayoutScroll(this.layout.virtualScrollY);
		}
	}

	public onScrollThumb(thumb: ViewScroller.Track, dp: number): void {
		this.layout!.scrollOn(dp, "x", thumb); // assume
	}

	public getLayout(): ViewScroller.Layout | undefined {
		return this.layout;
	}
}

namespace ViewScroller {
	export interface Attrs extends LinearLayout.Attrs {
	}

	export abstract class Layout extends LinearLayout {
		public virtualScrollX = 0;
		public virtualScrollWidth = 0;
		public virtualScrollY = 0;
		public virtualScrollHeight = 0;

		protected origin = 0;
		protected t1 = 0;
		protected t2 = 0;
		protected x1 = 0;
		protected x2 = 0;
		protected y1 = 0;
		protected y2 = 0;
		public readonly flingThreshold = 3;

		public constructor() {
			super();

			this.listen("pointerdown", this.onPointerDown);
			this.listen("pointerup", this.onPointerUp);
			this.listen("wheel", this.onWheel);
		}

		/**
		 * Fallback method to fill the omission of calling onLayout which is not triggered by changes of scroll size
		 * Sub classes should call this whenever scroll size changes
		 */
		protected onScrollSizeChanged(): void {
			this.parentView!.onChildLayout(this); // assume
		}

		protected onPointerDown(event: PointerEvent): void {
			this.t2 = this.t1 = this.origin = event.timeStamp;
			this.x2 = this.x1 = event.clientX;
			this.y2 = this.y1 = event.clientY;

			this.setPointerCapture(event.pointerId);
			this.listen("pointermove", this.onPointerMove);
		}
		protected onPointerMove(event: PointerEvent): void {
			this.t2 = this.t1;
			this.t1 = event.timeStamp;
			this.x2 = this.x1;
			this.x1 = event.clientX;
			this.y2 = this.y1;
			this.y1 = event.clientY;
			this.scrollBy(this.x2 - this.x1, this.y2 - this.y1);
		}
		protected onPointerUp(event: PointerEvent): void {
			if (!this.hasPointerCapture(event.pointerId)) {
				return;
			}
			this.removeEventListener("pointermove", this.onPointerMove);
			this.releasePointerCapture(event.pointerId);

			let dt = event.timeStamp - this.t2;
			if (dt == 0) {
				return;
			}

			dt = Math.log10(dt);
			this.x1 = this.x2 - event.clientX;
			this.x1 = Math.abs(this.x1) < 1 ? 0 : this.x1 / dt;
			this.y1 = this.y2 - event.clientY;
			this.y1 = Math.abs(this.y1) < 1 ? 0 : this.y1 / dt;

			if (this.x1 == 0 && this.y1 == 0) {
				return;
			}

			this.fling(this.origin);
		}
		protected onWheel(event: WheelEvent): void {
			this.origin = event.timeStamp;
			if (this.ot == "x") {
				this.x1 = event.deltaY / 5;
				this.y1 = event.deltaX / 5;
			}
			else {
				this.x1 = event.deltaX / 5;
				this.y1 = event.deltaY / 5;
			}

			this.fling(this.origin);
		}
		protected fling(origin: number): void {
			if (origin != this.origin) {
				return;
			}

			this.scrollBy(this.x1, this.y1);

			this.x1 *= 0.9;
			this.y1 *= 0.9;

			if (this.x1 < -this.flingThreshold || this.flingThreshold < this.x1
				|| this.y1 < -this.flingThreshold || this.flingThreshold < this.y1) {
				requestAnimationFrame(this.fling.bind(this, origin));
			}
		}

		public getScrollSize(axis: LinearLayout.Orientation = "x"): number {
			return this.ot == axis ? this.virtualScrollWidth : this.virtualScrollHeight;
		}
		public setScrollSize(size: number, axis: LinearLayout.Orientation = "x"): number {
			return this[this.ot == axis ? "virtualScrollWidth" : "virtualScrollHeight"] = size;
		}

		public getScrollOffset(axis: LinearLayout.Orientation = "x"): number {
			return this.ot == axis ? this.virtualScrollX : this.virtualScrollY;
		}
		public setScrollOffset(offset: number, axis: LinearLayout.Orientation = "x"): number {
			return this[this.ot == axis ? "virtualScrollX" : "virtualScrollY"] = offset;
		}

		public scrollSize(axis: LinearLayout.Orientation = "x"): number {
			return this.ot == axis ? this.scrollWidth : this.scrollHeight;
		}
		public scrollOffset(axis: LinearLayout.Orientation = "x"): number {
			return this.ot == axis ? this.scrollLeft : this.scrollTop;
		}
	}
	export namespace ScrollLayout {
		export interface Attrs extends LinearLayout.Attrs {
		}
	}

	export class Track extends LinearLayout {
		public thumb: Thumb = LinearLayout.create("scroller-thumb");

		protected paddingStart = 0;
		protected trackInnerSize = 0;
		protected track2scroll = 0; // used onThumbScrolled
		protected thumbSize = 0;
		protected thumbOffset = 0;
		protected hover = false;
		protected displayed = true;

		public constructor() {
			super();

			this.listen("mouseenter", this.onEnter);
			this.listen("mouseleave", this.onLeave);
		}

		protected onCreate(): void {
			super.onCreate();

			this.thumb.setAttribute("orientation", this.ot);
			this.contains(this.thumb) || this.addView(this.thumb);

			this.displayed = this.style.display != "none";
		}

		protected onLayout(rect: DOMRectReadOnly): void {
			super.onLayout(rect);
			this.paddingStart = this.getPaddingStart();
			this.trackInnerSize = this.getSize() - this.paddingStart - this.getPaddingEnd();
		}
		public onSizeChanged(viewSize: number, scrollSize: number, offset: number): void {
			if (scrollSize <= viewSize + 1) {
				this.displayed && (this.style.display = "none");
				this.displayed = false;
			}
			else {
				this.displayed || (this.style.display = "");
				this.displayed = true;
				this.track2scroll = this.trackInnerSize / scrollSize; // viewSize / scrollSize * this.trackSize / Scroller.size, assume viewSize == Scroller.size
				this.thumbSize = viewSize * this.track2scroll;
				this.onLayoutScroll(offset);
			}
		}

		public onLayoutScroll(offset: number): void {
			this.thumbOffset = this.paddingStart + this.thumbSize / 2 + offset * this.track2scroll;
			this.updateThumb();
		}
		protected updateThumb(): void {
			const trackWidth = this.getSize("y");
			const thumbHalf = (!this.hover ? this.thumbSize : this.thumbSize < trackWidth ? trackWidth : this.thumbSize) / 2;

			this.thumb.setStart(`${this.thumbOffset - thumbHalf}px`);
			this.thumb.setEnd(`${this.getSize() - (this.thumbOffset + thumbHalf)}px`);
		}

		protected onEnter(event: MouseEvent): void {
			super.onEnter(event);
			this.hover = true;
			this.updateThumb();
		}
		protected onLeave(event: MouseEvent): void {
			super.onLeave(event);
			this.hover = false;
			this.updateThumb();
		}

		public onThumbScrolled(dp: number): void {
			(this.parentView as ViewScroller).onScrollThumb(this, dp / this.track2scroll); // assume
		}
	}

	export class Thumb extends LinearLayout {
		protected p = 0;

		public constructor() {
			super();

			this.listen("pointerdown", this.onPointerDown);
			this.listen("pointerup", this.onPointerUp);
		}

		protected onPointerDown(event: PointerEvent): void {
			this.p = this.parentView!.getPointer(event); // assume
			this.setPointerCapture(event.pointerId);
			this.listen("pointermove", this.onPointerMove);
		}
		protected onPointerMove(event: PointerEvent): void {
			const p = this.parentView!.getPointer(event); // assume
			(this.parentView as ViewScroller.Track).onThumbScrolled(p - this.p);
			this.p = p;
		}
		protected onPointerUp(event: PointerEvent): void {
			this.removeEventListener("pointermove", this.onPointerMove);
			this.releasePointerCapture(event.pointerId);
		}
	}
}

LinearLayout.define("view-scroller", ViewScroller);
LinearLayout.define("scroller-track", ViewScroller.Track);
LinearLayout.define("scroller-thumb", ViewScroller.Thumb);

export default ViewScroller;
export {ViewScroller};

declare module "./LinearLayout" {
	namespace LinearLayout {
		interface Tag2Class {
			"view-scroller": ViewScroller;
			"scroller-track": ViewScroller.Track;
			"scroller-thumb": ViewScroller.Thumb;
		}
	}
}