import React from "react";
import { Link } from "react-router-dom";
import WordFrequencies from "./WordFrequencies.js";

const SearchResult = ({
	id,
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
			<div>
				<h2>{title}</h2>
			</div>
			<div>
				<Link to={`/result/${id}`} className="result-link">
					{url}
				</Link>
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
