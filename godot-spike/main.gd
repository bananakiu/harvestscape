extends Node2D
##
## HarvestScape -> Godot migration spike.
##
## De-risks the three subsystems that do NOT port trivially from the vanilla-JS
## canvas build. Everything here is generated in code at runtime — no asset files,
## preserving the shipped game's "100% procedural" design identity.
##
##   1. Procedural pixel-art   -> mirrors 03-art.js (mkSpr / px / seeded scatter)
##   2. Pixel-perfect 320x208  -> mirrors 00-core.js canvas + stretch pipeline
##   3. Synthesized audio      -> mirrors 02-audio.js WebAudio graph, via
##                                AudioStreamGenerator (raw sample push)
##
## Run headless-ish from the CLI: it draws a scene, plays a synth blip, saves a
## screenshot to res://spike_frame.png, prints proof lines, then quits.

const TILE := 16
const VIEW_W := 320
const VIEW_H := 208

# --- deterministic per-sprite scatter rng (mirrors _rs / rr() in 03-art.js) ---
var _rs := 1
func seed_rr(s: int) -> void:
    _rs = s
func rr() -> float:
    _rs = (_rs * 1103515245 + 12345) & 0x7fffffff
    return float(_rs) / float(0x7fffffff)

# --- image helpers (mirror px() / mkSpr()) ---
func new_img(w: int, h: int) -> Image:
    return Image.create(w, h, false, Image.FORMAT_RGBA8)

func px(img: Image, x: int, y: int, w: int, h: int, c: Color) -> void:
    for yy in range(h):
        for xx in range(w):
            var ix := x + xx
            var iy := y + yy
            if ix >= 0 and iy >= 0 and ix < img.get_width() and iy < img.get_height():
                img.set_pixel(ix, iy, c)

func tex(img: Image) -> ImageTexture:
    return ImageTexture.create_from_image(img)

# --- terrain: seasonal grass (Summer palette from GRASS_PAL in 03-art.js) ---
func build_grass(v: int) -> ImageTexture:
    var img := new_img(16, 16)
    seed_rr(11 + v * 7)
    var base := Color("5aa03c")
    var d := Color("4a8a32")
    var l := Color("72c04c")
    var bl := Color("3d7a2c")
    var tip := Color("8ace60")
    px(img, 0, 0, 16, 16, base)
    for i in range(26):
        var x := int(rr() * 16)
        var y := int(rr() * 16)
        px(img, x, y, 1, 1, l if rr() < 0.5 else d)
    for i in range(3):
        var x := int(rr() * 14) + 1
        var y := int(rr() * 12) + 2
        px(img, x, y, 1, 2, bl)
        px(img, x, y - 1, 1, 1, tip)
    return tex(img)

# --- tilled soil with furrows ---
func build_soil() -> ImageTexture:
    var img := new_img(16, 16)
    px(img, 0, 0, 16, 16, Color("6b4a2f"))
    for r in range(4):
        px(img, 0, r * 4 + 1, 16, 1, Color("563a25"))
        px(img, 0, r * 4 + 2, 16, 1, Color("7d5838"))
    return tex(img)

# --- a crop at three growth stages (seedling / sprout / ripe) ---
func build_crop(stage: int) -> ImageTexture:
    var img := new_img(16, 16)
    var stem := Color("3f8a34")
    var leaf := Color("57b048")
    var leaf_d := Color("3d7a2c")
    var fruit := Color("e0533b")
    if stage == 0:
        px(img, 7, 12, 2, 3, stem)
        px(img, 6, 11, 1, 1, leaf)
        px(img, 9, 11, 1, 1, leaf)
    elif stage == 1:
        px(img, 7, 8, 2, 7, stem)
        px(img, 5, 9, 2, 1, leaf)
        px(img, 9, 9, 2, 1, leaf)
        px(img, 5, 11, 2, 1, leaf_d)
        px(img, 9, 11, 2, 1, leaf_d)
    else:
        px(img, 7, 5, 2, 10, stem)
        px(img, 4, 7, 3, 2, leaf)
        px(img, 9, 7, 3, 2, leaf)
        px(img, 5, 10, 2, 1, leaf_d)
        px(img, 9, 10, 2, 1, leaf_d)
        px(img, 6, 4, 4, 4, fruit)
        px(img, 7, 4, 1, 1, Color("ff8a6b"))  # specular highlight
    return tex(img)

func place(t: Texture2D, gx: int, gy: int) -> void:
    var s := Sprite2D.new()
    s.texture = t
    s.centered = false
    s.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
    s.position = Vector2(gx * TILE, gy * TILE)
    add_child(s)

func _ready() -> void:
    # tiled grass background, scatter-selected per tile (deterministic)
    var grass: Array[ImageTexture] = []
    for v in range(4):
        grass.append(build_grass(v))
    var cols := VIEW_W / TILE + 1
    var rows := VIEW_H / TILE + 1
    for gy in range(rows):
        for gx in range(cols):
            seed_rr(gx * 7 + gy * 13 + 1)
            place(grass[int(rr() * 4)], gx, gy)

    # a planting row: tilled soil + the three crop stages
    var soil := build_soil()
    var row := 7
    for i in range(3):
        place(soil, 6 + i * 3, row)
        place(build_crop(i), 6 + i * 3, row)

    # a small self-documenting caption
    var lbl := Label.new()
    lbl.text = "HarvestScape - Godot spike\nprocedural art - no asset files"
    var ls := LabelSettings.new()
    ls.font_size = 8
    ls.font_color = Color("f5f0e6")
    ls.outline_size = 2
    ls.outline_color = Color("000000", 0.7)
    lbl.label_settings = ls
    lbl.position = Vector2(4, 2)
    add_child(lbl)

    synth_and_play()
    _capture_and_quit()

# --- synthesized "item-get" blip (mirrors the WebAudio SFX approach) ---
func synth_and_play() -> void:
    var sr := 44100
    var gen := AudioStreamGenerator.new()
    gen.mix_rate = sr
    gen.buffer_length = 0.6
    var player := AudioStreamPlayer.new()
    player.stream = gen
    add_child(player)
    player.play()
    var pb: AudioStreamGeneratorPlayback = player.get_stream_playback()

    var frames := PackedVector2Array()
    var notes := [660.0, 880.0, 1320.0]   # rising arpeggio
    var peak := 0.0
    for n in notes:
        var count := int(0.09 * sr)
        for i in range(count):
            var env := exp(-float(i) / count * 5.0)
            var s := sin(TAU * n * (float(i) / sr)) * env * 0.4
            peak = maxf(peak, absf(s))
            frames.append(Vector2(s, s))

    var avail := pb.get_frames_available()
    var to_push := frames if frames.size() <= avail else frames.slice(0, avail)
    pb.push_buffer(to_push)
    print("[spike] audio OK — synthesized %d samples, peak %.3f, pushed %d/%d"
        % [frames.size(), peak, to_push.size(), avail])

func _capture_and_quit() -> void:
    await RenderingServer.frame_post_draw
    await RenderingServer.frame_post_draw
    var img := get_viewport().get_texture().get_image()
    var err := img.save_png("res://spike_frame.png")
    print("[spike] render OK — viewport %dx%d, screenshot saved (err=%d)"
        % [img.get_width(), img.get_height(), err])
    await get_tree().create_timer(0.35).timeout   # let the blip sound
    get_tree().quit()
