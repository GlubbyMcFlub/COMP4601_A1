import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function Result() {
	const { id } = useParams();
	const [resultData, setResultData] = useState({});

	useEffect(() => {
		const fetchResultData = async () => {
			try {
				const response = await fetch(`/fruits/?id=${id}`);
				const data = await response.json();
				setResultData(data);
			} catch (error) {
				console.error("Error fetching result data:", error);
			}
		};

		fetchResultData();
	}, [id]);

	return (
		<div className="Result">
			<h2>{resultData.title}</h2>
			<p>URL: {resultData.url}</p>
			{/* Display other result details as needed */}
		</div>
	);
}

export default Result;
