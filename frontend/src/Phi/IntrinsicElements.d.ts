import type LinearLayout from "LinearLayout";
import type ViewScroller from "ViewScroller";
import type ListView from "ListView";
import type SwipableListView from "SwipableListView";

export {};

declare type ViewAttrs = LinearLayout.Attrs & React.HTMLAttributes<HTMLElement>;

declare type ScrollerAttrs = ViewScroller.Attrs & React.HTMLAttributes<HTMLElement>;

declare type ListViewAttrs = ListView.Attrs & React.HTMLAttributes<HTMLElement>;

declare type SwipableListViewAttrs = SwipableListView.Attrs & React.HTMLAttributes<HTMLElement>;

declare global {
	namespace JSX {
		interface IntrinsicElements {
			"linear-layout": React.DetailedHTMLProps<ViewAttrs, HTMLElement>;
			"view-scroller": React.DetailedHTMLProps<ScrollerAttrs, HTMLElement>;
			"list-view": React.DetailedHTMLProps<ListViewAttrs, HTMLElement>;
			"swipable-list-view": React.DetailedHTMLProps<SwipableListViewAttrs, HTMLElement>;
		}
	}
}