import mongoose from "mongoose";
const { Schema } = mongoose;

const linkSchema = new Schema(
	{
		title: {	//N-0, technically not required
			type: String,
			required: true,
		},	
		link: {	//view-source:https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html
			type: String,
			required: true,
		},
		numIncomingLinks: {	//increment
			type: Number,
			required: true,
		},
		paragraph: {	//all the fruits, technically not required
			type: String,
			required: true,
		},
		incomingLinks: [{ type: Schema.Types.ObjectId, ref: "linkSchema" }],	//corresponding mongoose id
		outgoingLinks: [{ type: Schema.Types.ObjectId, ref: "linkSchema" }],	//corresponding mongoose id, technically not required
	},
	{ timestamps: true }
);

reviewSchema.index({ numIncomingLinks: 0 });

const LinkModel = mongoose.model("LinkModel", linkSchema);
export default LinkModel;
