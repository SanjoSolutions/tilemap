/* global PIXI */

const renderer = PIXI.autoDetectRenderer({ width: 800, height: 600 });
let stage;
let tilemap;

let atlas;
let button;

document.body.appendChild(renderer.view);

const loadAssets = async () => {
    atlas = await PIXI.Assets.load('assets/atlas.json');
    button = await PIXI.Assets.load('assets/button.png');

    stage = new PIXI.Container();
    tilemap = new PIXI.tilemap.CompositeTilemap();
    stage.addChild(tilemap);

    PIXI.Ticker.shared.add(() => renderer.render(stage));

    let frame = 0;

    buildTilemap(frame++);

    const pic = new PIXI.Sprite(button);

    pic.position.set(200, 100);
    stage.addChild(pic);

    // ==== Old way to build animations: Rebuild tilemap every frame
    function animRebuild() {
        buildTilemap(frame++);
    }

    // ==== New way: animate shader
    function animShader() {
        // animate X frames
        renderer.plugins.tilemap.tileAnim[0] = frame;
        // animate Y frames
        renderer.plugins.tilemap.tileAnim[1] = frame;
        frame++;
    }

    setInterval(animShader, 100);
}

function buildTilemap() {
    // Clear everything, like a PIXI.Graphics
    tilemap.clear();

    const size = 32;

    // if you are too lazy, just specify filename and pixi will find it in cache
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 5; j++) {
            tilemap.tile('grass.png', i * size, j * size);

            if (i % 2 === 1 && j % 2 === 1) {
                tilemap.tile('tough.png', i * size, j * size);
            }
        }
    }

    // if you are lawful citizen, please use textures from
    const textures = atlas.textures;

    tilemap.tile(textures['brick.png'], 2 * size, 2 * size);
    tilemap.tile(textures['brick_wall.png'], 2 * size, 3 * size, { alpha: 0.6 });

    // chest will be animated!
    // old way: animate on rebuild
    // tilemap.addFrame(textures[frame % 2 == 0 ? "chest.png" : "red_chest.png"], 4 * size, 4 * size);

    // new way: animate on shader: 2 frames , X offset is 32 , "red_chest" is exactly 34 pixels right in the atlas
    // Frame changes every 100ms because of `setInterval(animShader, 100)`, so the first animation
    // will change to the next frame every 100ms
    tilemap.tile(textures['chest.png'], 4 * size, 4 * size).tileAnimX(34, 2);

    // You can also set independent time for each tile.
    // In this second chest, we pass 3 to tileAnimDivisor
    // 3 multiplies the 100ms we have in setInterval by 3, making the duration 300ms
    tilemap.tile(textures['chest.png'], 5 * size, 4 * size).tileAnimX(34, 2).tileAnimDivisor(3);
    // You can alternatively set it by passing animDivisor option when creating the tile. Below a frame duration is 600ms
    tilemap.tile(textures['chest.png'], 8 * size, 4 * size, { animX: 34, animCountX: 2, animDivisor: 6 });

    // button does not appear in the atlas, but tilemap wont surrender, it will create second layer for special for buttons
    // buttons will appear above everything
    tilemap.tile(button, 6 * size, 2 * size);

    // if you want rotations:
    // https://pixijs.io/examples-v4/#/textures/texture-rotate.js
    // textures should have frame, orig and trim to do that
    // canvas in pixi-tilemap does not work with rotate!!!!
    const origTex = textures['chest.png'];

    for (let i = 0; i < 8; i++) {
        const frame = origTex.frame.clone();
        const orig = origTex.orig.clone();
        const trim = origTex.orig.clone();
        const rotate = i * 2;

        if (rotate % 4 === 2) {
            orig.width = frame.height;
            orig.height = frame.width;
        }

        const tmpTex = new PIXI.Texture(origTex.baseTexture, frame, orig, trim, rotate);

        // Swap W and H in orig if you rotate%4 is not 0
        tilemap.tile(tmpTex, i % 4 * size, ((i >> 2) * size) + (5 * size));
        // rotate is also last parameter in addFrame
    }
}

loadAssets();