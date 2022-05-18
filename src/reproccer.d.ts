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
