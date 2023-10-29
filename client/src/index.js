import React from "react";
import ReactDOM from "react-dom/client";
import ContainerPage from "./pages/ContainerPage.js";

const root = ReactDOM.createRoot(document.getElementById("root"));

/*
	This is the entry point of the application. It renders the ContainerPage component.
	Params: none
*/
root.render(
	<React.StrictMode>
		<ContainerPage />
	</React.StrictMode>
);
