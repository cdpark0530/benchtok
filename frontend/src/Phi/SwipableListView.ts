import "./SwipableListView.scss";
import LinearLayout from "./LinearLayout";
import ListView from "./ListView";

class SwipableListView extends ListView {
	protected static readonly magnetRatio = 0.6;
	// @ts-ignore assumes the client has registered an adapter for this instance
	protected adapter: SwipableListView.Adapter;
	protected pressed?: LinearLayout;
	protected swiping?: LinearLayout;
	protected swipingPoint = 0;
	protected startSwipingView?: LinearLayout;
	protected endSwipingView?: LinearLayout;


	protected onCreate(): void {
		super.onCreate();

		this.startSwipingView = this.adapter.leftSwipingView();
		this.endSwipingView = this.adapter.rightSwipingView();

		if (this.startSwipingView && !this.parentView!.contains(this.startSwipingView)) {
			this.startSwipingView.setAttribute("swiping-position", "start");
			this.startSwipingView.setSize(this.startSwipingView.getAttribute("swiping-size")!, "y", this);
			this.parentView!.addView(this.startSwipingView);
		}
		if (this.endSwipingView && !this.parentView!.contains(this.endSwipingView)) {
			this.endSwipingView.setAttribute("swiping-position", "end");
			this.endSwipingView.setSize(this.endSwipingView.getAttribute("swiping-size")!, "y", this);
			this.parentView!.addView(this.endSwipingView);
		}
	}

	protected onLayout(rect: DOMRectReadOnly): void {
		super.onLayout(rect);

		// TODO: initial swiping
	}

	public onChildLayout(child: LinearLayout): void {
		super.onChildLayout(child);

		// TODO: initial swiping
	}


	protected onPointerDown(event: PointerEvent): void {
		super.onPointerDown(event);

		const child = LinearLayout.from(this.x1, this.y1);
		if (!child || !this.contains(child)) {
			return;
		}
		const holder = this.view2holder.get(child)!;
		if (this.adapter.swipable(holder.pos)) {
			this.pressed = holder.view;
			this.pressed.classList.remove("smooth");

			if (this.swiping && this.pressed != this.swiping) {
				this.releaseSwiping();
			}
		}
	}
	protected onPointerMove(event: PointerEvent): void {
		if (!this.pressed && !this.swiping) {
			super.onPointerMove(event);
			return;
		}

		const cd = this.getPointerDiff(event, "y");
		if (this.swiping) {
			return this.swipe(cd);
		}

		const md = this.getPointerDiff(event);
		const cScrollOffset = this.getScrollOffset("y");
		if (Math.abs(cd) > Math.abs(md * 4) && (cd < 0 ? cScrollOffset < 1 : this.getScrollSize("y") - cScrollOffset - this.getSize("y") < 1)) {
			this.swiping = this.pressed;
			this.updateLayout();
			this.swiping!.updateLayout();
			if (this.startSwipingView) {
				this.startSwipingView.setStart(`${this.swiping!.getStart("x", this) - this.getStart()}px`, "x", this);
				this.startSwipingView.setSize(`${this.swiping!.getSize("x", this)}px`, "x", this);
			}
			if (this.endSwipingView) {
				this.endSwipingView.setStart(`${this.swiping!.getStart("x", this) - this.getStart()}px`, "x", this);
				this.endSwipingView.setSize(`${this.swiping!.getSize("x", this)}px`, "x", this);
			}
			this.swipe(cd);
		}
		else {
			super.onPointerMove(event);
		}
		this.pressed = undefined;
	}
	protected onPointerUp(event: PointerEvent): void {
		if (this.swiping) {
			this.t2 = event.timeStamp; // prevents fling
			this.swiping.classList.add("smooth");

			this.swipe(0, true);
			this.swipingPoint == 0 && (this.swiping = undefined);
		}

		super.onPointerUp(event);
	}

	protected getPointerDiff(event: PointerEvent, axis: LinearLayout.Orientation = "x"): number {
		return -(this.ot == axis ? (this.x2 = this.x1) - (this.x1 = event.clientX) : (this.y2 = this.y1) - (this.y1 = event.clientY));
	}

	protected onWheel(event: WheelEvent): void {
		this.swiping && this.releaseSwiping();

		super.onWheel(event);
	}

	protected swipe(d: number, up = false): void {
		this.swipingPoint += d;
		this.swipingPoint < 0
			? this.endSwipingView || (this.swipingPoint = 0)
			: this.startSwipingView || (this.swipingPoint = 0);

		const swipingViewSize = this[this.swipingPoint < 0 ? "endSwipingView" : "startSwipingView"]!.getSize("y", this);
		const threshold = up ? swipingViewSize * SwipableListView.magnetRatio : swipingViewSize;
		this.swipingPoint = Math.abs(this.swipingPoint) > threshold
			? swipingViewSize * (this.swipingPoint < 0 ? -1 : 1)
			: up ? 0 : this.swipingPoint;

		this.swiping!.setStart(`${this.swipingPoint}px`, "y", this);
	}
	protected releaseSwiping(): void {
		this.swipingPoint = 0;
		this.swiping!.setStart("0px", "y", this);
		this.swiping = undefined;
	}
}

namespace SwipableListView {
	export interface Attrs extends ListView.Attrs {
	}

	export abstract class Adapter<H extends ListView.ViewHolder = ListView.ViewHolder> extends ListView.Adapter<H> {
		public swipable(pos: number): boolean {
			return true;
		}
		public leftSwipingView(): LinearLayout | undefined {
			return undefined;
		}
		public rightSwipingView(): LinearLayout | undefined {
			return undefined;
		}
	}
}

LinearLayout.define("swipable-list-view", SwipableListView);

export default SwipableListView;
export {SwipableListView};

declare module "./LinearLayout" {
	namespace LinearLayout {
		interface Tag2Class {
			"swipable-list-view": SwipableListView;
		}
	}
}