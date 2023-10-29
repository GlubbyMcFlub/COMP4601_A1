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
	return (
		<div className="search-result">
			<div className="result-header">
				<div className="result-number">{result}</div>
				<div className="result-info">
					<h2>{title}</h2>
					<Link to={`/result/${id}`} className="result-link">
						{url}
					</Link>
				</div>
			</div>
			<div className="result-content">
				<div className="result-details">
					<div className="result-detail">
						<h4>Score:</h4>
						<p>{score}</p>
					</div>
					<div className="result-detail">
						<h4>PageRank:</h4>
						<p>{pageRank}</p>
					</div>
				</div>
				<WordFrequencies wordFrequencies={wordFrequencies} />
			</div>
		</div>
	);
};

export default SearchResult;
