import mongoose, {Schema, Document} from "mongoose";

export interface IKeys extends Document{
    _id : String;
    intestrialAd : string;
    bannerAd : string;
    rewardedAd : string;
    adCounter : Number;
    subscriptionAmount : Number;
}

const advertisementSchema = new Schema<IKeys>({
    intestrialAd : {type : String, default:""},
    bannerAd : {type : String, default:""},
    rewardedAd : {type : String, default:""},
    adCounter : {type : Number, default:0},
    subscriptionAmount : {type : Number, default:0}
});

const Keys = mongoose.models.Keys || mongoose.model<IKeys>("Keys", advertisementSchema);

export default Keys;