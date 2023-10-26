import React from "react";
import WordFrequencies from "./WordFrequencies.js";

const SearchResult = ({
	title,
	paragraph,
	result,
	score,
	url,
	pageRank,
	wordFrequencies,
}) => {
	return (
		<div className="search-result">
			<h2>{title}</h2>
			{
				<a href={url} target="_blank" rel="noopener noreferrer">
					<h4>{url}</h4>
				</a>
			}
			<p>{paragraph}</p>
			<p>Score = {score}</p>
			<p>PageRank = {pageRank}</p>
			<WordFrequencies wordFrequencies={wordFrequencies} />
			<footer>Result #: {result}</footer>
		</div>
	);
};

export default SearchResult;
