import React from "react";
import { Link } from "react-router-dom";
import "../assets/styles.css";
import WordFrequencies from "./WordFrequencies.js";

/*
	This component is a search result that displays basic information about a single result. Clicking on one of these results will take you to the Result page.
	Params: 
	- id (string): the id of the result
	- title (string): the title of the result
	- result (number): the number of the result
	- score (number): the score of the result
	- url (string): the url of the result
	- pageRank (number): the page rank of the result
	- wordFrequencies (object): the word frequencies of the result
*/
const SearchResult = ({
	id,
	title,
	result,
	score,
	url,
	pageRank,
	wordFrequencies,
}) => {
	const truncatedURL = url.length > 50 ? url.slice(0, 50) + "..." : url;
	const formattedScore = score.toFixed(10);
	const formattedPageRank = pageRank.toFixed(10);

	return (
		<div className="search-result">
			<div className="result-header">
				<div className="result-number">{result}</div>
				<div className="result-info">
					<h2>{title}</h2>
					<a
						href={url}
						className="result-link"
						target="_blank"
						rel="noopener noreferrer"
					>
						{truncatedURL}
					</a>
				</div>
			</div>
			<div className="result-content">
				<div className="result-details">
					<div className="result-detail">
						<h4>Score:</h4>
						<p>{formattedScore}</p>
					</div>
					<div className="result-detail">
						<h4>PageRank:</h4>
						<p>{formattedPageRank}</p>
					</div>
				</div>
				<WordFrequencies wordFrequencies={wordFrequencies} />
			</div>
		</div>
	);
};

export default SearchResult;
