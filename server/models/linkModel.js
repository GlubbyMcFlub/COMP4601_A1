import mongoose from "mongoose";
const { Schema } = mongoose;

const linkSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		numIncomingLinks: {
			type: Number,
			required: true,
		},
		//whatever other page info we deem necessary
		//title (prolly change name to title)
		//paragraph body
		incomingLinks: [{ type: Schema.Types.ObjectId, ref: "linkSchema" }],
		outgoingLinks: [{ type: Schema.Types.ObjectId, ref: "linkSchema" }],
	},
	{ timestamps: true }
);

reviewSchema.index({ numIncomingLinks: 0 });

const LinkModel = mongoose.model("LinkModel", linkSchema);
export default LinkModel;
