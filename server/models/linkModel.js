import mongoose from "mongoose";
const { Schema } = mongoose;

const linkSchema = new Schema(
	{
		title: {
			type: String,
			default: "",
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
			of: mongoose.Schema.Types.Mixed,
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
		score: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true }
);

linkSchema.virtual("numIncomingLinks").get(function () {
	return this.incomingLinks.length;
});

linkSchema.index({ numIncomingLinks: 1, link: 1 }); // Index by number of incoming links and link itself

const LinkModel = mongoose.model("LinkModel", linkSchema);
export default LinkModel;
