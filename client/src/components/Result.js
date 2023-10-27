import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import WordFrequencies from "./WordFrequencies";

function Result() {
	const { id } = useParams();
	const [resultData, setResultData] = useState({});

	useEffect(() => {
		const fetchResultData = async () => {
			try {
				const response = await fetch(
					`/fruits/?id=${encodeURIComponent(id.toLowerCase())}`
				);
				console.log(response);
				const data = await response.json();
				setResultData(data);
			} catch (error) {
				console.error("Error fetching result data:", error);
			}
		};

		fetchResultData();
	}, [id]);

	return (
		<div>
			<div>
				<Link to="/">Back to Search Results</Link>
			</div>
			<div className="search-result result">
				<div>
					<h2>{resultData.title}</h2>
				</div>
				<div>
					<h4>URL</h4>
					<a href={resultData.url} target="_blank" rel="noopener noreferrer">
						<p>{resultData.url}</p>
					</a>
				</div>
				<div>
					<h4>Score</h4>
					<p>{resultData.score}</p>
				</div>
				<div>
					<h4>PageRank</h4>
					<p>{resultData.pr}</p>
				</div>
				<div>
					<h4>Final Score</h4>
					<p>{resultData.finalScore}</p>
				</div>
				<WordFrequencies wordFrequencies={resultData.wordFrequencies} />
				<div>
					<h4>Content</h4>
					<p>{resultData.paragraph}</p>
				</div>
				<div>
					<h4>Incoming Links</h4>
					<ul>
						{resultData.incomingLinks &&
							resultData.incomingLinks.map((link, index) => (
								<li key={index}>
									<a href={link} target="_blank" rel="noopener noreferrer">
										{link}
									</a>
								</li>
							))}
					</ul>
				</div>
				<div>
					<h4>Outgoing Links</h4>
					<ul>
						{resultData.outgoingLinks &&
							resultData.outgoingLinks.map((link, index) => (
								<li key={index}>
									<a href={link} target="_blank" rel="noopener noreferrer">
										{link}
									</a>
								</li>
							))}
					</ul>
				</div>
			</div>
		</div>
	);
}

export default Result;
