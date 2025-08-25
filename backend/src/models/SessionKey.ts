import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISessionKey extends Document {
  participants: Types.ObjectId[];
  keyHex: string;
  protocol: string;
  expiresAt: Date;
  eveDetected?: boolean;
  qber?: number;
}

const SessionKeySchema = new Schema<ISessionKey>({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  keyHex: { type: String, required: true },
  protocol: { type: String, default: 'BB84' },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  eveDetected: { type: Boolean, default: false },
  qber: { type: Number },
});

export default mongoose.model<ISessionKey>('SessionKey', SessionKeySchema);


