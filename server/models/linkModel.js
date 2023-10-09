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
		},
		paragraph: {
			type: String,
			default: "",
		},
		incomingLinks: [],
		outgoingLinks: [],
	},
	{ timestamps: true }
);

linkSchema.virtual("numIncomingLinks").get(function () {
	return this.incomingLinks.length;
});

linkSchema.index({ numIncomingLinks: 1, link: 1 }); // Index by number of incoming links and link itself

const LinkModel = mongoose.model("LinkModel", linkSchema);
export default LinkModel;
