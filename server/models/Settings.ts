import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
    backgroundImage: {
        type: String,
        default: "https://storage.googleapis.com/aistudio-user-uploads/b2c8a1e8-d1a2-4b3c-9d4e-5f6a7b8c9d0e.png"
    },
    promoBanner: {
        type: String,
        default: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070"
    },
    spotlightImages: {
        type: [String],
        default: [
            "https://via.placeholder.com/300x400?text=Spotlight+1",
            "https://via.placeholder.com/300x400?text=Spotlight+2",
            "https://via.placeholder.com/300x400?text=Spotlight+3",
            "https://via.placeholder.com/300x400?text=Spotlight+4",
            "https://via.placeholder.com/300x400?text=Spotlight+5"
        ]
    },
    combatArmoryName: {
        type: String,
        default: "Combat Armory Tier"
    },
    combatArmoryImage: {
        type: String,
        default: "https://cdn.discordapp.com/attachments/1492459270564741273/1493677975315419236/4_1.png?ex=69dfd784&is=69de8604&hm=7e9d37824a788f8a2161fcb6786d07a985cd2415aac399080d2a14fdcd3513a0&"
    },
    weaponLicenseName: {
        type: String,
        default: "ใบอนุญาตครอบครองอาวุธ"
    },
    weaponLicenseImage: {
        type: String,
        default: ""
    },
    weaponLicenseLevelNames: {
        type: [String],
        default: Array.from({ length: 15 }, (_, index) => `LEVEL ${index + 1}`)
    },
    weaponLicenseWebhookSuccessMessage: {
        type: String,
        default: "{player} ได้อัพเกรด \"{function} {level} {result}\""
    },
    weaponLicenseWebhookFailureMessage: {
        type: String,
        default: "{player} อัพเกรด \"{function} {level} {result}\""
    },
    taskFunctionName: {
        type: String,
        default: "สุ่มความสำเร็จภารกิจ"
    },
    taskFunctionImage: {
        type: String,
        default: ""
    },
    taskNames: {
        type: [String],
        default: ["ภารกิจ 1", "ภารกิจ 2", "ภารกิจ 3"]
    },
    taskImages: {
        type: [String],
        default: ["", "", ""]
    }
});

export const Settings: mongoose.Model<any> = mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
