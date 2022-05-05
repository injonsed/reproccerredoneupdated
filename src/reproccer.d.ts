declare interface AlchemyBaseStats {
    duration: number,
    priceLimits: {
        lower: number,
        upper: number
    },
    usePriceLimits: boolean
}

declare interface AlchemySettings {
    baseStats: AlchemyBaseStats,
    enabled: true
}

declare interface ArmorBaseStats {
    maxProtection: number,
    multipliers: {
        boots: number,
        cuirass: number,
        gauntlets: number,
        helmet: number,
        shield: number
    },
    protectionPerArmor: number
}

declare interface ArmorModifiers {
    armorStrongerLow: number,
    armorStrongerMedium: number,
    armorStrongerHigh: number,
    armorWeakerLow: number,
    armorWeakerMedium: number,
    armorWeakerHigh: number
}

declare interface ArmorSettings {
    baseStats: ArmorBaseStats,
    enabled: boolean,
    modifiers: ArmorModifiers
}

declare interface ProjectileSettings {
    enabled: boolean
}

declare interface WeaponBaseStats {
    damage: {
        bow: number,
        crossbow: number,
        oneHanded: number,
        twoHanded: number
    },
    damageBonuses: {
        recurveCrossbow: number
    },
    speedBonuses: {
        arbalestCrossbow: number,
        lightweightCrossbow: number
    },
    weightMultipliers: {
        arbalestCrossbow: number,
        lightweightCrossbow: number
    }
}

declare interface WeaponModifiers {
    weaponStrongerLow: number,
    weaponStrongerMedium: number,
    weaponStrongerHigh: number,
    weaponWeakerLow: number,
    weaponWeakerMedium: number,
    weaponWeakerHigh: number
}

declare interface WeaponSettings {
    baseStats: WeaponBaseStats,
    enabled: boolean,
    modifiers: WeaponModifiers
}

declare interface InteractionIconsSettings {
    enabled: boolean
}

declare interface NPCSettings {
    enabled: boolean,
    plugins: Array<string>
}

declare interface DefaultSettings {
    patchFileName: string,
    alchemy: AlchemySettings,
    armor: ArmorSettings,
    projectiles: ProjectileSettings,
    weapons: WeaponSettings,
    npc: NPCSettings,
    lang: string,
    icons: InteractionIconsSettings,
    ignoredFiles: Array<string>
}

declare interface IRecipe {
    handle: handle,
    cnamv: string,
    cnam: number,
    bnam: number
}

declare interface MaterialMap {
    name: string,
    kwda: string,
    input?: string,
    perk?: string,
    bnam?: string,
    func?: string
}

declare interface IJSONElement {
    name: string;
    edid: string;
    edidMatch?: string;
    substring?: string;
}

declare interface IProjectileStats {
    range: number,
    speed: number,
    gravity: number,
    damage: number,
    identifier?: string,
    type?: string,
    failed?: boolean,
    name?: string,
    edid?: string
}

declare type kwdaCallback = (kwda: string) => boolean;
declare type GetHextCallback = (formId: number, filename: string) => string;

declare class IFormIDList {
    armorStrongerLow: string;
    armorStrongerMedium: string;
    armorStrongerHigh: string;
    armorWeakerLow: string;
    armorWeakerMedium: string;
    armorWeakerHigh: string;
    // Weapon Modifiers
    weaponStrongerLow: string;
    weaponStrongerMedium: string;
    weaponStrongerHigh: string;
    weaponWeakerLow: string;
    weaponWeakerMedium: string;
    weaponWeakerHigh: string;
    excludeFromMeltdownRecipes: string;
    // Explosions
    expBarbed: string;
    expElementalFire: string;
    expElementalFrost: string;
    expElementalShock: string;
    expExploding: string;
    expHeavyweight: string;
    expNoisemaker: string;
    expNeuralgia: string;
    expTimebomb: string;
    // Game Settings
    gmstArmorScalingFactor: string;
    gmstMaxArmorRating: string;
    // Items
    ingotCorundum: string;
    ingotDwarven: string;
    ingotEbony: string;
    ingotGold: string;
    ingotIron: string;
    ingotMalachite: string;
    ingotMoonstone: string;
    ingotOrichalcum: string;
    ingotQuicksilver: string;
    ingotSilver: string;
    ingotSteel: string;
    ale: string;
    boneMeal: string;
    charcoal: string;
    chaurusChitin: string;
    chitinPlate: string;
    deathBell: string;
    dragonbone: string;
    dragonscale: string;
    fireSalt: string;
    firewood: string;
    frostSalt: string;
    leather: string;
    leatherStrips: string;
    netchLeather: string;
    oreStalhrim: string;
    pettySoulGem: string;
    torchbugThorax: string;
    voidSalt: string;
    // Keywords
    kwClothingHands: string;
    kwClothingHead: string;
    kwClothingFeet: string;
    kwClothingBody: string;
    kwArmorClothing: string;
    kwArmorHeavy: string;
    kwArmorLight: string;
    kwArmorDreamcloth: string;
    // Keywords - Armor Materials
    kwArmorMaterialBlades: string;
    kwArmorMaterialDaedric: string;
    kwArmorMaterialDarkBrotherhood: string;
    kwArmorMaterialDawnguard: string;
    kwArmorMaterialDragonplate: string;
    kwArmorMaterialDragonscale: string;
    kwArmorMaterialDwarven: string;
    kwArmorMaterialEbony: string;
    kwArmorMaterialElven: string;
    kwArmorMaterialElvenGilded: string;
    kwArmorMaterialFalmerHardened: string;
    kwArmorMaterialFalmerHeavy: string;
    kwArmorMaterialFalmerHeavyOriginal: string;
    kwArmorMaterialForsworn: string;
    kwArmorMaterialFur: string;
    kwArmorMaterialGlass: string;
    kwArmorMaterialHide: string;
    kwArmorMaterialHunter: string;
    kwArmorMaterialImperialHeavy: string;
    kwArmorMaterialImperialLight: string;
    kwArmorMaterialImperialStudded: string;
    kwArmorMaterialIron: string;
    kwArmorMaterialIronBanded: string;
    kwArmorMaterialLeather: string;
    kwArmorMaterialNightingale: string;
    kwArmorMaterialNordicHeavy: string;
    kwArmorMaterialOrcish: string;
    kwArmorMaterialScaled: string;
    kwArmorMaterialStalhrimHeavy: string;
    kwArmorMaterialStalhrimLight: string;
    kwArmorMaterialSteel: string;
    kwArmorMaterialSteelPlate: string;
    kwArmorMaterialStormcloak: string;
    kwArmorMaterialStudded: string;
    kwArmorMaterialThievesGuild: string;
    kwArmorMaterialVampire: string;
    kwDLC1ArmorMaterialDawnguard: string;
    kwDLC1ArmorMaterialHunter: string;
    kwDLC2ArmorMaterialChitinLight: string;
    kwDLC2ArmorMaterialChitinHeavy: string;
    kwDLC2ArmorMaterialBonemoldLight: string;
    kwDLC2ArmorMaterialBonemoldHeavy: string;
    kwWAF_ArmorMaterialDraugr: string;
    kwWAF_ArmorMaterialGuard: string;
    kwWAF_ArmorMaterialThalmor: string;
    kwWAF_ArmorWolf: string;
    kwWAF_DLC1ArmorDawnguardHeavy: string;
    kwWAF_DLC1ArmorDawnguardLight: string;
    kwArmorShieldHeavy: string;
    kwArmorShieldLight: string;
    kwArmorSlotGauntlets: string;
    kwArmorSlotHelmet: string;
    kwArmorSlotBoots: string;
    kwArmorSlotCuirass: string;
    kwArmorSlotShield: string;
    kwCraftingSmelter: string;
    kwCraftingSmithingArmorTable: string;
    kwCraftingSmithingForge: string;
    kwCraftingSmithingSharpeningWheel: string;
    kwCraftingTanningRack: string;
    kwJewelry: string;
    kwMasqueradeBandit: string;
    kwMasqueradeForsworn: string;
    kwMasqueradeImperial: string;
    kwMasqueradeStormcloak: string;
    kwMasqueradeThalmor: string;
    kwVendorItemClothing: string;
    // Keywords - Weapon Materials
    kwWAF_WeapMaterialBlades: string;
    kwWAF_WeapMaterialForsworn: string;
    kwWAF_DLC1WeapMaterialDawnguard: string;
    kwWAF_TreatAsMaterialDaedric: string;
    kwWAF_TreatAsMaterialDragon: string;
    kwWAF_TreatAsMaterialDwarven: string;
    kwWAF_TreatAsMaterialEbony: string;
    kwWAF_TreatAsMaterialElven: string;
    kwWAF_TreatAsMaterialGlass: string;
    kwWAF_TreatAsMaterialIron: string;
    kwWAF_TreatAsMaterialLeather: string;
    kwWAF_TreatAsMaterialOrcish: string;
    kwWAF_TreatAsMaterialSteel: string;
    kwDLC2WeaponMaterialStalhrim: string;
    kwWeapMaterialDaedric: string;
    kwWeapMaterialDragonbone: string;
    kwWeapMaterialDraugr: string;
    kwWeapMaterialDraugrHoned: string;
    kwWeapMaterialDwarven: string;
    kwWeapMaterialEbony: string;
    kwWeapMaterialElven: string;
    kwWeapMaterialFalmer: string;
    kwWeapMaterialFalmerHoned: string;
    kwWeapMaterialGlass: string;
    kwWeapMaterialImperial: string;
    kwWeapMaterialIron: string;
    kwWeapMaterialNordic: string;
    kwWeapMaterialOrcish: string;
    kwWeapMaterialSilver: string;
    kwWeapMaterialSilverRefined: string;
    kwWeapMaterialSteel: string;
    kwWeapMaterialWood: string;
    // Keywords - Weapon Types
    kwWeapTypeBastardSword: string;
    kwWeapTypeBattleaxe: string;
    kwWeapTypeBattlestaff: string;
    kwWeapTypeBoundWeapon: string;
    kwWeapTypeBow: string;
    kwWeapTypeBroadsword: string;
    kwWeapTypeClub: string;
    kwWeapTypeCrossbow: string;
    kwWeapTypeDagger: string;
    kwWeapTypeGlaive: string;
    kwWeapTypeGreatsword: string;
    kwWeapTypeHalberd: string;
    kwWeapTypeHatchet: string;
    kwWeapTypeKatana: string;
    kwWeapTypeLongbow: string;
    kwWeapTypeLongmace: string;
    kwWeapTypeLongsword: string;
    kwWeapTypeMace: string;
    kwWeapTypeMaul: string;
    kwWeapTypeNodachi: string;
    kwWeapTypeSaber: string;
    kwWeapTypeScimitar: string;
    kwWeapTypeShortbow: string;
    kwWeapTypeShortspear: string;
    kwWeapTypeShortsword: string;
    kwWeapTypeStaff: string;
    kwWeapTypeSword: string;
    kwWeapTypeTanto: string;
    kwWeapTypeUnarmed: string;
    kwWeapTypeWakizashi: string;
    kwWeapTypeWaraxe: string;
    kwWeapTypeWarhammer: string;
    kwWeapTypeYari: string;
    // Other keywords
    kwDLC1CrossbowIsEnhanced: string;
    kwMagicDisallowEnchanting: string;
    // Activator keywords
    kwActivatorLever: string;
    // Lights
    lightLightsource: string;
    // Perks
    perkAlchemyFuse: string;
    perkAlchemyAdvancedExplosives: string;
    perkDreamclothBody: string;
    perkDreamclothHands: string;
    perkDreamclothHead: string;
    perkDreamclothFeet: string;
    perkEnchantingElementalBombard0: string;
    perkEnchantingElementalBombard1: string;
    perkMarksmanshipAdvancedMissilecraft0: string;
    perkMarksmanshipAdvancedMissilecraft1: string;
    perkMarksmanshipAdvancedMissilecraft2: string;
    perkMarksmanshipArbalest: string;
    perkMarksmanshipBallistics: string;
    perkMarksmanshipEngineer: string;
    perkMarksmanshipLightweightConstruction: string;
    perkMarksmanshipRecurve: string;
    perkMarksmanshipSilencer: string;
    perkSilverPerk: string;
    perkSmithingAdvanced: string;
    perkSmithingArcaneBlacksmith: string;
    perkSmithingDaedric: string;
    perkSmithingDragon: string;
    perkSmithingDwarven: string;
    perkSmithingEbony: string;
    perkSmithingElven: string;
    perkSmithingGlass: string;
    perkSmithingLeather: string;
    perkSmithingMeltdown: string;
    perkSmithingOrcish: string;
    perkSmithingSilver: string;
    perkSmithingSilverRefined: string;
    perkSmithingSteel: string;
    perkSmithingWeavingMill: string;
    perkSneakThiefsToolbox0: string;
    perkWeaponCrossbow: string;
    perkWeaponCrossbowArbalest: string;
    perkWeaponCrossbowArbalestSilenced: string;
    perkWeaponCrossbowSilenced: string;
    perkWeaponShortspear: string;
    perkWeaponSilverRefined: string;
    perkWeaponYari: string;
    // Sound descriptors
    itmCoinPouchUp: string;
    itmCoinPouchDown: string;
    itmMushroomUp: string;
    itmClampUp: string;
    itmPotionUpSD: string;
}