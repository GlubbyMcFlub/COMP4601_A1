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
			<a href={url} target="_blank" rel="noopener noreferrer">
				<h4>{url}</h4>
			</a>
			<div>
				<h4>Content</h4>
				<p>{paragraph}</p>
			</div>
			<div>
				<h4>Score</h4>
				<p>{score}</p>
			</div>
			<div>
				<h4>PageRank</h4>
				<p>{pageRank}</p>
			</div>
			<WordFrequencies wordFrequencies={wordFrequencies} />
			<div>
				<h4>Result #{result}</h4>
			</div>
		</div>
	);
};

export default SearchResult;
