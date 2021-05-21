import { model, Schema, Model, Document } from "mongoose";

interface ILedgerUpdate extends Document {
  modifiedAt: number
}

const LedgerUpdateSchema: Schema = new Schema({
  modifiedAt: { type: Number }
}, { 
  versionKey: false
});

const LedgerUpdate: Model<ILedgerUpdate> = model("LedgerUpdate", LedgerUpdateSchema);
export default LedgerUpdate;
