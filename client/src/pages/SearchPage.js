import React, { useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import "../assets/SearchPage.css";
import Result from "../components/Result";
import SearchResult from "../components/SearchResult.js";

function SearchPage({ onDarkMode, onSearchResults }) {
	const [query, setQuery] = useState("");
	const [maxResults, setMaxResults] = useState(10);
	const [isBoosted, setIsBoosted] = useState(false);
	const navigate = useNavigate();
	const [hasSearched, setHasSearched] = useState(false);
	const [selectedResult, setSelectedResult] = useState(null);
	const [searchResults, setSearchResults] = useState([]);

	let endpoint = "/fruits/";

	const handleResultClick = (id) => {
		navigate(`/result/${id}`);
		setSelectedResult(id);
	};

	const handleSearch = async () => {
		try {
			const response = await fetch(
				`${endpoint}?q=${encodeURIComponent(
					query.toLowerCase()
				)}&limit=${maxResults}&boost=${isBoosted}`
			);
			const data = await response.json();
			onSearchResults(data); // Update search results in the parent component
			setSearchResults(data);
			setHasSearched(true);
		} catch (error) {
			console.error("Error:", error);
		}
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	const handleThemeChange = () => {
		onDarkMode();
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
			{hasSearched && !selectedResult && (
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
						<p className="error-message">No search results found.</p>
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
