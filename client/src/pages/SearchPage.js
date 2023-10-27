import React, { useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import "../assets/SearchPage.css";
import LoadingIcon from "../components/LoadingIcon"; // Import your loading icon component
import Result from "../components/Result";
import SearchResult from "../components/SearchResult.js";

function SearchPage({ onDarkMode, onSearchResults }) {
	const [query, setQuery] = useState("");
	const [maxResults, setMaxResults] = useState(10);
	const [isBoosted, setIsBoosted] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);
	const [selectedResult, setSelectedResult] = useState(null);
	const [searchResults, setSearchResults] = useState([]);
	const [isLoading, setIsLoading] = useState(false); // Loading state
	const navigate = useNavigate();

	const handleResultClick = (id) => {
		navigate(`/result/${id}`);
		setSelectedResult(id);
	};

	const handleSearch = async () => {
		try {
			setIsLoading(true); // Set loading state to true while waiting for the response
			const response = await fetch(
				`/fruits/?q=${encodeURIComponent(
					query.toLowerCase()
				)}&limit=${maxResults}&boost=${isBoosted}`
			);
			const data = await response.json();
			onSearchResults(data);
			setSearchResults(data);
			setHasSearched(true);
		} catch (error) {
			console.error("Error:", error);
		} finally {
			setIsLoading(false); // Reset loading state when the response is received
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
						Max Results:
						<input
							type="number"
							value={maxResults}
							onChange={(e) => setMaxResults(e.target.value)}
							min="1"
						/>
					</label>
					<label>
						Boost Results:
						<input
							type="checkbox"
							checked={isBoosted}
							onChange={() => setIsBoosted(!isBoosted)}
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
									id={result.id}
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
						<p className="error-message">No search results found.</p> // TODO: As per A1 specs, this will never actually appear (we return random data if no results are found)
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
