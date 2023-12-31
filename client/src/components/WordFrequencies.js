import React from "react";

/*
	This component is a list of word frequencies
	Params: 
	- wordFrequencies (map): a map of words to their frequencies
*/
const WordFrequencies = ({ wordFrequencies }) => {
	if (!wordFrequencies) {
		return null;
	}

	const wordFrequencyItems = wordFrequencies.map(([word, frequency], index) => (
		<button className="word-button" key={index}>
			{word}: {frequency}
		</button>
	));

	return (
		<div className="word-frequencies">
			<h4>Word Frequency</h4>
			{wordFrequencyItems}
		</div>
	);
};

export default WordFrequencies;
