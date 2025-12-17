export const GYM_IMAGES: Record<string, any> = {
  silver_pack: require("@/assets/images/silver_pack.png"),
  gold_pack: require("@/assets/images/gold_pack.png"),
  platinum_pack: require("@/assets/images/platinum_pack.png"),
  // New Tier Keys mapping to same assets
  tier_standard: require("@/assets/images/icon.png"), // Fallback for standard
  tier_silver: require("@/assets/images/silver_pack.png"),
  tier_gold: require("@/assets/images/gold_pack.png"),
  tier_platinum: require("@/assets/images/platinum_pack.png"),

  morning_yoga: require("@/assets/images/morning_yoga.png"),
  hiit_cardio: require("@/assets/images/hiit_cardio.png"),
  body_pump: require("@/assets/images/body_pump.png"),
  // Fallback
  default: require("@/assets/images/icon.png"),
};
