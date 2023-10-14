import React, { useState } from "react";
import "./App.css";
import SearchResult from "./components/SearchResult/SearchResult";

function App() {
	const [query, setQuery] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [hasSearched, setHasSearched] = useState(false);

	const handleSearch = async () => {
		try {
			const response = await fetch(
				`/links/?query=${encodeURIComponent(query)}`
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

	return (
		<div className="App">
			<h1>Qooqle</h1>
			<input
				type="text"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder="Whatcha lookin' for?"
			/>
			<button onClick={handleSearch}>Search</button>
			{hasSearched && (
				<div className="search-results">
					{searchResults.length > 0 ? (
						searchResults.map((result, index) => (
							<SearchResult
								key={index}
								title={result.title}
								paragraph={result.paragraph}
								url={result.url}
								result={index}
							/>
						))
					) : (
						<p>No results found. {searchResults.message}</p>
					)}
				</div>
			)}
		</div>
	);
}

export default App;
