import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/SearchPage.css";
import SearchResult from "../components/SearchResult.js";

function SearchPage() {
	const [query, setQuery] = useState("");
	const [maxResults, setMaxResults] = useState(10); // Default to 10 results
	const [isBoosted, setIsBoosted] = useState(false);
	const navigate = useNavigate();
	const [searchResults, setSearchResults] = useState([]);
	const [hasSearched, setHasSearched] = useState(false);
	const [isDarkMode, setIsDarkMode] = useState(
		window.matchMedia("(prefers-color-scheme: dark)").matches
	);

	let endpoint = "/fruits/";

	useEffect(() => {
		if (isDarkMode) {
			document.body.classList.add("dark-mode");
		} else {
			document.body.classList.remove("dark-mode");
		}
	}, [isDarkMode]);

	const handleResultClick = (id) => {
		navigate(`/result/${id}`); // Using navigate instead of history.push
	};

	const handleSearch = async () => {
		try {
			// needs to support the following parameters:
			// q - query
			// boost - true or false
			// limit - number of results to return
			const response = await fetch(
				`${endpoint}?q=${encodeURIComponent(
					query.toLowerCase()
				)}&limit=${maxResults}&boost=${isBoosted}`
			);
			const data = await response.json();
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
		setIsDarkMode(!isDarkMode);
	};

	// add boost checkbox, and number of results form/slider
	return (
		<div className="SearchPage">
			<div>
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
			{hasSearched && (
				<div className="search-results">
					{Object.keys(searchResults).length > 0 ? (
						Object.keys(searchResults).map((key, index) => {
							const result = searchResults[key];
							return (
								<div
									key={index}
									onClick={() => handleResultClick(result.id)}
									className="search-result-item"
								>
									<SearchResult
										key={index}
										title={result.title}
										paragraph={result.paragraph}
										url={result.url}
										score={result.score}
										wordFrequencies={result.wordFrequencies}
										pageRank={result.pageRank}
										result={index + 1}
									/>
								</div>
							);
						})
					) : (
						<p className="error-message">No search results found.</p>
					)}
				</div>
			)}
		</div>
	);
}

export default SearchPage;
