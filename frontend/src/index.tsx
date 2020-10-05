import "./index.scss";

// replacements for deprecated @babel/polyfill
import "core-js/stable";
import "regenerator-runtime/runtime";

import React from "react";
import ReactDOM from "react-dom";
import LinearLayout from "LinearLayout";

import("Components/App")
	.then(({default: App}) => {
		const app = LinearLayout.create("linear-layout"); // creates the root also to make sure it will get initialized
		app.id = "app";
		document.body.appendChild(app);
		ReactDOM.render(
			<React.StrictMode>
				<App />
			</React.StrictMode>,
			app
		);
	});
