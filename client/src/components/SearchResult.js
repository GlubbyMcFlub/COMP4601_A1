import React from "react";

const SearchResult = ({ title, paragraph, result, score }) => {
	return (
		<div className="search-result">
			<h2>{title}</h2>
			{/* <a href={url} target="_blank" rel="noopener noreferrer">
				<h4>{url}</h4>
			</a> */}
			<p>{paragraph}</p>
			<p>Score = {score}</p>
			<footer>Result #: {result}</footer>
		</div>
	);
};

export default SearchResult;
