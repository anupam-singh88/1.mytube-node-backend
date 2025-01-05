import { Schema, model } from "mongoose"

const tweetSchema = new Schema(
    {
        content: {
            type: String,
            required: [true, "content is required"]
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

export const Tweet = model("Tweet", tweetSchema);