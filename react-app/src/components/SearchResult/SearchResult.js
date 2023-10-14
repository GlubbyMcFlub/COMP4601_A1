import React from "react";

const SearchResult = ({ title, paragraph, url, result, score }) => {
	return (
		<div className="search-result">
			<h2>{title}</h2>
			<h4>{url}</h4>
			<p>{paragraph}</p>
			<p>Score = {score}</p>
			<footer>Result #: {result}</footer>
		</div>
	);
};

export default SearchResult;
