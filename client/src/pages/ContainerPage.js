import React, { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Result from "../components/Result";
import SearchPage from "./SearchPage";

/*
	This component is the container for the entire application. It handles routing and dark mode (global states).
	Params: none
	States: 
	- darkMode (boolean): whether dark mode is enabled
	- database (string): the endpoint to fetch data from (fruits or personal)
*/
function ContainerPage() {
	const [darkMode, setDarkMode] = useState(
		window.matchMedia("(prefers-color-scheme: dark)").matches
	);
	const [database, setDatabase] = useState("fruits");
	const handleDatabase = (db) => {
		setDatabase(db);
	};

	const toggleDarkMode = () => {
		setDarkMode(!darkMode);
	};
	useEffect(() => {
		if (darkMode) {
			document.body.classList.add("dark-mode");
		} else {
			document.body.classList.remove("dark-mode");
		}
	}, [darkMode]);

	return (
		<Router>
			<Routes>
				<Route
					path="/"
					element={
						<SearchPage
							onDarkMode={toggleDarkMode}
							onChangeDatabase={handleDatabase}
						/>
					}
				/>
				<Route path="/result/:id" element={<Result database={database} />} />
			</Routes>
		</Router>
	);
}

export default ContainerPage;
