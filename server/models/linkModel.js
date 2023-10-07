import mongoose from "mongoose";
const { Schema } = mongoose;

const linkSchema = new Schema(
	{
		title: {
			type: String,
			required: true,
		},
		link: {
			type: String,
			required: true,
			unique: true,
		},
		paragraph: {
			type: String,
			required: true,
		},
		incomingLinks: [{ type: Schema.Types.ObjectId, ref: "LinkModel" }],
		outgoingLinks: [{ type: Schema.Types.ObjectId, ref: "LinkModel" }],
	},
	{ timestamps: true }
);

linkSchema.virtual("numIncomingLinks").get(function () {
	return this.incomingLinks.length;
});

linkSchema.index({ numIncomingLinks: 1, link: 1 }); // Index by number of incoming links and link itself

const LinkModel = mongoose.model("LinkModel", linkSchema);
export default LinkModel;
