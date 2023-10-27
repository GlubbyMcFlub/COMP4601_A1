import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoadingIcon from "./LoadingIcon"; // Import your loading icon component
import WordFrequencies from "./WordFrequencies";

function Result({ database }) {
	const { id } = useParams();
	const [resultData, setResultData] = useState({});
	const [isLoading, setIsLoading] = useState(true); // Loading state

	useEffect(() => {
		const fetchResultData = async () => {
			try {
				const response = await fetch(
					`/${database}/?id=${encodeURIComponent(id.toLowerCase())}`
				);
				const data = await response.json();
				setResultData(data);
			} catch (error) {
				console.error("Error fetching result data:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchResultData();
	}, [id, database]);

	return (
		<div className="result-container">
			<div>
				<Link to="/">Back to Search Results</Link>
			</div>
			{isLoading ? (
				<LoadingIcon className="loading-icon" /> // Show loading icon while data is being fetched
			) : (
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
						<h4>PageRank</h4>
						<p>{resultData.pr}</p>
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
			)}
		</div>
	);
}

export default Result;
