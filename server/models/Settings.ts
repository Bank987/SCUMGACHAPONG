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
    }
});

export const Settings = mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
