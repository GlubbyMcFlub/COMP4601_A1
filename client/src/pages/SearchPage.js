import React, { useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import "../assets/styles.css";
import LoadingIcon from "../components/LoadingIcon";
import Result from "../components/Result";
import SearchResult from "../components/SearchResult.js";

/*
	This component is the search page of the application. It handles searching and displaying search results.
	Params:
	- onDarkMode (function): a function that toggles dark mode
	- onChangeDatabase (function): a function that changes the database endpoint for requests (fruits or personal)
	States:
	- query (string): the query to search for
	- maxResults (number): the maximum number of results to return
	- isBoosted (boolean): whether to boost results
	- isPersonal (boolean): whether to search the personal database
	- hasSearched (boolean): whether a search has been performed
	- selectedResult (string): the id of the result that has been selected
	- searchResults (array): the search results
	- isLoading (boolean): whether the data is being fetched

	TODO: Add searchResults state so that returning to the search page from a result page doesn't cause a re-search (this is a nice-to-have feature)
*/
function SearchPage({ onDarkMode, onChangeDatabase }) {
	const [query, setQuery] = useState("");
	const [maxResults, setMaxResults] = useState(10);
	const [isBoosted, setIsBoosted] = useState(false);
	const [isPersonal, setIsPersonal] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);
	const [selectedResult, setSelectedResult] = useState(null);
	const [searchResults, setSearchResults] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();

	const handleResultClick = (id) => {
		navigate(`/result/${id}`);
		setSelectedResult(id);
		onChangeDatabase(isPersonal ? "personal" : "fruits");
	};

	const handleSearch = async () => {
		try {
			setIsLoading(true);
			let apiUrl = `/${
				isPersonal ? "personal" : "fruits"
			}/?limit=${maxResults}&boost=${isBoosted}`;
			if (query.trim() !== "") {
				apiUrl += `&q=${encodeURIComponent(query.toLowerCase())}`;
			}

			const response = await fetch(apiUrl);
			const data = await response.json();
			setSearchResults(data);
			setHasSearched(true);
		} catch (error) {
			console.error("Error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleThemeChange = () => {
		onDarkMode();
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	return (
		<div className={`SearchPage ${selectedResult ? "hidden" : ""}`}>
			<div className="search-component">
				<h1>Qooqle</h1>
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Whatcha lookin' for?"
				/>
				<button onClick={handleSearch}>Search</button>
				<button onClick={handleThemeChange}>Change Theme</button>
				<div className="filter-container">
					<label>
						Limit:
						<input
							type="number"
							value={maxResults}
							onChange={(e) => setMaxResults(e.target.value)}
							min="1"
							max="50" // TODO: You can still enter a number greater than 50 if you type, but not if you use the up/down arrows (leaving as is, doubt this will be an issue)
						/>
					</label>
					<label>
						Boost:
						<input
							type="checkbox"
							checked={isBoosted}
							onChange={() => setIsBoosted(!isBoosted)}
						/>
					</label>
					<label>
						Personal DB:
						<input
							type="checkbox"
							checked={isPersonal}
							onChange={() => setIsPersonal(!isPersonal)}
						/>
					</label>
				</div>
			</div>
			{isLoading && <LoadingIcon className="loading-icon" />}
			{hasSearched && !selectedResult && !isLoading && (
				<div className="search-results">
					{searchResults.length > 0 ? (
						searchResults.map((result, index) => (
							<div
								key={index}
								onClick={() => handleResultClick(result.id)}
								className="search-result-item"
							>
								<SearchResult
									key={index}
									title={result.title}
									url={result.url}
									score={result.score}
									pageRank={result.pr}
									result={index + 1}
								/>
							</div>
						))
					) : (
						<p className="error-message">No search results found.</p> // TODO: As per A1 specs, this will never actually appear (we return random data if no results are found), keeping it anyways
					)}
				</div>
			)}
			<Routes>
				{selectedResult && <Route path="/result/:id" element={<Result />} />}
			</Routes>
		</div>
	);
}

export default SearchPage;
