import React from "react";

const WordFrequencies = ({ wordFrequencies }) => {
	if (!wordFrequencies) {
		return null;
	}

	const wordFrequencyItems = Object.entries(wordFrequencies).map(
		([word, frequency]) => (
			<button className="word-button" key={word}>
				{word}: {frequency}
			</button>
		)
	);

	return (
		<div className="word-frequencies">
			<h4>Word Frequency</h4>
			{wordFrequencyItems}
		</div>
	);
};

export default WordFrequencies;
