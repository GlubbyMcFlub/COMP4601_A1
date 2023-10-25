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

// must display the following
// URL to original page
// title of original page
// computed search score for the page
// PageRank of the page
// Link to view the data your search engine has for this page
//      includes at least URL, title, list of incoming links fot he page, outgoing links, word frequency information, any additional data

export default SearchResult;
