import React, { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Result from "../components/Result";
import SearchPage from "./SearchPage";

function ContainerPage() {
	const [searchResults, setSearchResults] = useState([]); // Manage search results here
	const [darkMode, setDarkMode] = useState(
		window.matchMedia("(prefers-color-scheme: dark)").matches
	);
	const handleSearchResults = (results) => {
		setSearchResults(results);
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
							onSearchResults={handleSearchResults}
						/>
					}
				/>
				<Route
					path="/result/:id"
					element={<Result searchResults={searchResults} />}
				/>
			</Routes>
		</Router>
	);
}

export default ContainerPage;
