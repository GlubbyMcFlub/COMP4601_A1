import React from "react";
import { Link } from "react-router-dom";
import "../assets/SearchPage.css";
import WordFrequencies from "./WordFrequencies.js";

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
