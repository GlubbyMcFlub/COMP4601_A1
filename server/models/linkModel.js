import mongoose from "mongoose";
const { Schema } = mongoose;

/*
	Schema for a link
	{
		title: String,
		link: String,
		paragraph: String,
		wordFrequencies: Map<String, Number>,
		incomingLinks: [String],
		outgoingLinks: [String],
		pageRank: Number,
	}
*/
const linkSchema = new Schema(
	{
		title: {
			type: String,
			default: "",
			index: true,
		},
		link: {
			type: String,
			required: true,
			unique: true,
			default: "",
		},
		paragraph: {
			type: String,
			default: "",
			index: true,
		},
		wordFrequencies: {
			type: Map,
			of: { type: Number },
			index: true,
		},
		incomingLinks: {
			type: [String],
			default: [],
		},
		outgoingLinks: {
			type: [String],
			default: [],
			index: true,
		},
		pageRank: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true }
);

// Define a fruit and personal model, each of type linkSchema, but with different collections
const FruitModel = mongoose.model("LinkModel", linkSchema, "fruit_links");
const PersonalModel = mongoose.model(
	"PersonalModel",
	linkSchema,
	"personal_links"
);
export { FruitModel, PersonalModel };
