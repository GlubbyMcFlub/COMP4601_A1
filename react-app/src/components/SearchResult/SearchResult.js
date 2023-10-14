import React from "react";

const SearchResult = ({ title, paragraph, url, result }) => {
	return (
		<div className="search-result">
			<h2>{title}</h2>
			<h4>{url}</h4>
			<p>{paragraph}</p>
			<footer>Result #: {result}</footer>
		</div>
	);
};

export default SearchResult;
