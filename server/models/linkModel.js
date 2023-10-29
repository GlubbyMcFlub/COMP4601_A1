import mongoose from "mongoose";
const { Schema } = mongoose;

const linkSchema = new Schema(
	{
		title: {
			type: String,
			default: "",
			index: true, // Index the 'title' field for faster searches
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
		},
		wordFrequencies: {
			type: Map,
			of: { type: Number }, // Specify the type of values in the map
			index: true, // Index the 'wordFrequencies' field for efficient key phrase searches
		},
		incomingLinks: {
			type: [String],
			default: [],
		},
		outgoingLinks: {
			type: [String],
			default: [],
		},
		pageRank: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true }
);

const FruitModel = mongoose.model("LinkModel", linkSchema, "fruit_links");
const PersonalModel = mongoose.model(
	"PersonalModel",
	linkSchema,
	"personal_links"
);
export { FruitModel, PersonalModel };
