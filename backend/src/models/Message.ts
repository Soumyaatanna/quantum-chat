import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  sender: Types.ObjectId;
  receiver?: Types.ObjectId; // Optional for room messages
  roomId?: Types.ObjectId; // Optional for room messages
  ciphertext: string;
  iv: string;
  authTag?: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'User' }, // Optional for room messages
  roomId: { type: Schema.Types.ObjectId, ref: 'Room' }, // Optional for room messages
  ciphertext: { type: String, required: true },
  iv: { type: String, required: true },
  authTag: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } });

export default mongoose.model<IMessage>('Message', MessageSchema);


