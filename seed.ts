import mongoose from "mongoose";
import { Case } from "./server/models/Case.js";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const seedData = [
  {
    name: "CS2 Premium Case",
    description: "The ultimate collection of premium skins.",
    image: "https://raw.githubusercontent.com/SteamDatabase/GameTracking-CS2/master/csgo/pak01_dir/resource/flash/econ/weapon_cases/crate_csgo_3.png",
    price: 10,
    items: [
      {
        name: "AWP | Dragon Lore",
        image: "https://raw.githubusercontent.com/SteamDatabase/GameTracking-CS2/master/csgo/pak01_dir/resource/flash/econ/default_generated/weapon_awp_cu_dragon_awp_light.png",
        rarity: "Covert",
        dropRate: 0.5,
        color: "#EB4B4B"
      },
      {
        name: "M4A4 | Howl",
        image: "https://raw.githubusercontent.com/SteamDatabase/GameTracking-CS2/master/csgo/pak01_dir/resource/flash/econ/default_generated/weapon_m4a1_cu_m4a4_howling_light.png",
        rarity: "Contraband",
        dropRate: 1.5,
        color: "#E4AE39"
      },
      {
        name: "AK-47 | Fire Serpent",
        image: "https://raw.githubusercontent.com/SteamDatabase/GameTracking-CS2/master/csgo/pak01_dir/resource/flash/econ/default_generated/weapon_ak47_cu_ak47_cobra_light.png",
        rarity: "Covert",
        dropRate: 3.0,
        color: "#EB4B4B"
      },
      {
        name: "Desert Eagle | Blaze",
        image: "https://raw.githubusercontent.com/SteamDatabase/GameTracking-CS2/master/csgo/pak01_dir/resource/flash/econ/default_generated/weapon_deagle_aa_flames_light.png",
        rarity: "Restricted",
        dropRate: 15.0,
        color: "#8847FF"
      },
      {
        name: "Glock-18 | Fade",
        image: "https://raw.githubusercontent.com/SteamDatabase/GameTracking-CS2/master/csgo/pak01_dir/resource/flash/econ/default_generated/weapon_glock_aa_fade_light.png",
        rarity: "Restricted",
        dropRate: 20.0,
        color: "#8847FF"
      },
      {
        name: "USP-S | Kill Confirmed",
        image: "https://raw.githubusercontent.com/SteamDatabase/GameTracking-CS2/master/csgo/pak01_dir/resource/flash/econ/default_generated/weapon_usp_silencer_cu_usp_kill_confirmed_light.png",
        rarity: "Covert",
        dropRate: 10.0,
        color: "#EB4B4B"
      },
      {
        name: "P250 | Sand Dune",
        image: "https://raw.githubusercontent.com/SteamDatabase/GameTracking-CS2/master/csgo/pak01_dir/resource/flash/econ/default_generated/weapon_p250_sp_dune_light.png",
        rarity: "Consumer Grade",
        dropRate: 50.0,
        color: "#B0C3D9"
      }
    ]
  },
  {
    name: "Knife Case",
    description: "Guaranteed knife drops.",
    image: "https://raw.githubusercontent.com/SteamDatabase/GameTracking-CS2/master/csgo/pak01_dir/resource/flash/econ/weapon_cases/crate_csgo_2.png",
    price: 50,
    items: [
      {
        name: "Karambit | Fade",
        image: "https://raw.githubusercontent.com/SteamDatabase/GameTracking-CS2/master/csgo/pak01_dir/resource/flash/econ/default_generated/weapon_knife_karambit_aa_fade_light.png",
        rarity: "Rare Special Item",
        dropRate: 10.0,
        color: "#FFD700"
      },
      {
        name: "Butterfly Knife | Doppler",
        image: "https://raw.githubusercontent.com/SteamDatabase/GameTracking-CS2/master/csgo/pak01_dir/resource/flash/econ/default_generated/weapon_knife_butterfly_am_doppler_phase4_light.png",
        rarity: "Rare Special Item",
        dropRate: 20.0,
        color: "#FFD700"
      },
      {
        name: "M9 Bayonet | Crimson Web",
        image: "https://raw.githubusercontent.com/SteamDatabase/GameTracking-CS2/master/csgo/pak01_dir/resource/flash/econ/default_generated/weapon_knife_m9_bayonet_hy_webs_light.png",
        rarity: "Rare Special Item",
        dropRate: 30.0,
        color: "#FFD700"
      },
      {
        name: "Navaja Knife | Safari Mesh",
        image: "https://raw.githubusercontent.com/SteamDatabase/GameTracking-CS2/master/csgo/pak01_dir/resource/flash/econ/default_generated/weapon_knife_gypsy_jackknife_sp_mesh_tan_light.png",
        rarity: "Rare Special Item",
        dropRate: 40.0,
        color: "#FFD700"
      }
    ]
  }
];

async function seed() {
  if (!MONGODB_URI) {
    console.log("No MONGODB_URI provided. Skipping seed.");
    process.exit(0);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB for seeding...");

    await Case.deleteMany({});
    console.log("Cleared existing cases.");

    await Case.insertMany(seedData);
    console.log("Seeded cases successfully!");

    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();
