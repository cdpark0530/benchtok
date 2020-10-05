import React from "react";

import LinearLayout from "LinearLayout";
import ListView from "ListView";
import SwipableListView from "SwipableListView";

export default function Body() {
	return (
		<view-scroller>
			<swipable-list-view id="list" orientation="y" />
		</view-scroller>
	);
}

class MyAdapter extends SwipableListView.Adapter {
	private templates: HTMLTemplateElement[] = [
		document.createElement("template"),
	];

	private items: number[] = [];

	public constructor() {
		super();

		this.templates[0].innerHTML = `<linear-layout style="min-height: 200px"></linear-layout>`;
		for (let i = 0; i < 100; i++) {
			this.items.push(i);
		}
	}
	public count(): number {
		return this.items.length;
	}
	public id(pos: number): number {
		return pos;
	}

	public leftSwipingView(): LinearLayout | undefined {
		const v = LinearLayout.create("linear-layout");
		v.style.backgroundColor = "red";
		v.setAttribute("swiping-size", "20%");
		return v;
	}
	public rightSwipingView(): LinearLayout | undefined {
		const v = LinearLayout.create("linear-layout");
		v.style.backgroundColor = "blue";
		v.setAttribute("swiping-size", "20%");
		return v;
	}

	public onCreate(viewType: number): ListView.ViewHolder {
		return new (class TestViewHolder extends ListView.ViewHolder {
		})(this.templates[viewType].content.firstElementChild!.cloneNode() as LinearLayout);
	}
	public onBind(holder: ListView.ViewHolder): void {
		holder.view.textContent = `${holder.pos}: This text is just for making the view having a large span`;
	}
	public removeItems(from: number, count: number): void {
		this.items.removeFrom(from, count);
		this.notifyItemsRemoved(from, count);
	}
}

const adapter = new MyAdapter();
ListView.register("list", adapter);
//@ts-ignore
window.adapter = adapter;