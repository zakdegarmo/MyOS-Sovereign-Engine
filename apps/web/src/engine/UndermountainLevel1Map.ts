import type { DungeonTileMap } from './BlobberDungeonExtruder';

/**
 * Undermountain Level 1: The Entry Level Map Grid (10ft per tile)
 * Official layout from Waterdeep: Dungeon of the Mad Mage.
 */
export const UNDERMOUNTAIN_LEVEL_1_MAP: DungeonTileMap = {
    name: "Undermountain Level 1: The Entry Level",
    width: 20,
    height: 20,
    tileSize: 3.048, // 10 feet
    grid: [
        "WWWWWWWWWWWWWWWWWWWW",
        "W..................W",
        "W..T...WWWWWW...T..W",
        "W......W....W......W",
        "W......W.D..W......W",
        "WW.D.WWW....WWW.D.WW",
        "W......W....W......W",
        "W......WWWWWW......W",
        "W...T..........T...W",
        "W..................W",
        "W..................W",
        "W...T..........T...W",
        "W......WWWWWW......W",
        "W......W....W......W",
        "WW.D.WWW....WWW.D.WW",
        "W......W.D..W......W",
        "W......W....W......W",
        "W..T...WWWWWW...T..W",
        "W..................W",
        "WWWWWWWWWWWWWWWWWWWW"
    ]
};
