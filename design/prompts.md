# Graphics prompts (ChatGPT image generation)

The character sprite sheets and the debate studio background are AI-generated with ChatGPT (Pro) image generation from the prompts below, sent in one conversation in this order so the style stays consistent. They are then sliced by `scripts/slice-sprites.ts` and converted by `scripts/process-assets.ts`. Sources are in `design/source/`. Disclosed here and in the README as the hackathon rules require.

The logo mark (`design/source/logo.webp`, the glowing Bull and Bear) is supplied by the author and processed by `scripts/process-logo.ts`.

Design constraints applied to every prompt:
- No text, no product name and no logos in the generated images. The NEAR symbol shown on the studio's emblem plate is drawn in code from the official SVG, on top of the blank plate.
- Palette: near-black `#060A08`, NEAR-inspired mint `#00EC97` (Bull and the product accent), coral `#FF7966` (Bear), warm white `#F2F1E9`.
- Characters: polished 16-bit pixel art, identical size and position in every frame so they can be animated by frame swaps. Serious tone, no grinning.

## 1. Bull (sprite sheet)

> Create an image: a high-quality pixel-art character sprite sheet for a serious financial debate show. Character: an anthropomorphic bull investment analyst, brown fur, cream curved horns, wearing a sharp black suit, white shirt and mint-green (#00EC97) tie, facing three-quarter to the right. Tone: serious, intelligent, confident and professional, like a TV market analyst; never silly, no grinning, the neutral face is calm and determined. Framing: waist-up, arms and hands visible. Style: polished 16-bit retro pixel art, crisp hard pixel edges, clean dark outlines, limited palette, subtle mint rim light. Layout: exactly 8 frames in a 4-column by 2-row grid of equal cells on one flat solid magenta (#FF00FF) background; identical character design, size and position in every cell, waist at the same height in every cell; only expression, mouth and arms change. Row 1: (1) neutral listening, mouth closed, arms relaxed; (2) talking, mouth open, arms relaxed; (3) explaining, mouth open, one hand raised open-palm at chest height; (4) making a point, mouth open, index finger pointing forward. Row 2: (5) thinking, hand on chin, eyes looking up; (6) surprised, eyes wide, mouth round, slight lean back; (7) agreeing, small confident nod, mouth closed; (8) disagreeing, arms crossed, frown. No text, no labels, no grid lines, no borders, no logos, no letters.

## 2. Bear (sprite sheet)

> Excellent, exactly the right tone. Now create his opponent as a matching sprite sheet: same polished 16-bit pixel art style, same scale, same waist-up framing, same 4x2 layout, same eight poses in the same order, same flat solid magenta (#FF00FF) background. Character: an anthropomorphic brown bear investment analyst with thin rectangular glasses, sharp black suit, white shirt and coral-red (#FF7966) tie, facing three-quarter to the LEFT (toward the bull), subtle coral rim light. Tone: serious, skeptical, precise and composed; never cartoonish. Poses: (1) neutral listening, mouth closed; (2) talking, mouth open; (3) explaining, mouth open, one hand raised open-palm; (4) making a point, mouth open, index finger pointing forward; (5) thinking, hand on chin; (6) surprised, eyes wide, mouth round; (7) agreeing, small nod, mouth closed; (8) disagreeing, arms crossed, frown. No text, no labels, no grid lines, no borders, no logos, no letters.

## 3. Judge (sprite sheet)

> Perfect. Now the debate judge as the third matching sprite sheet: same polished 16-bit pixel art style, same scale, same waist-up framing, same 4x2 layout, same flat solid magenta (#FF00FF) background. Character: a wise owl judge with brown and cream feathers and round gold spectacles, wearing a black judge's robe with gold trim and a small gold four-pointed-star badge (a simple shape, no letters), facing the viewer straight on. Tone: calm, impartial, authoritative, serious. Poses in this order: (1) neutral, listening, wings folded; (2) talking, beak open; (3) explaining, beak open, one wing raised open at chest height; (4) announcing a ruling, beak open, one wing lifted with a small wooden gavel; (5) thinking, wing on chin; (6) surprised, eyes wide, beak open; (7) approving, small nod, beak closed; (8) disapproving, wings crossed, stern frown. No text, no labels, no grid lines, no borders, no logos, no letters.

## 4. Debate studio

> Wonderful. Finally the background these three characters will stand in. Wide 16:9 landscape image of a premium dark television debate studio, completely empty (no people, no animals, no characters), in the same polished 16-bit pixel art style. Composition, left to right: a podium on the left third with mint-green (#00EC97) light strips; a raised, wider judge's desk in the center; a podium on the right third with coral (#FF7966) light strips. The two side podiums are identical in shape and mirror each other, with flat tops at the same height and a plain dark front panel. Behind the center desk, a tall glowing mint light pillar with an empty circular emblem plate near its upper part (leave it blank). A large screen behind the left podium shows a rising green candlestick chart; a large screen behind the right podium shows a falling red candlestick chart. Near-black background (#060A08), soft ceiling spotlights, reflective floor, cinematic but calm. Keep the area directly above each podium and above the center desk clear so the characters can be placed standing behind them. Absolutely no text, words, letters, numbers or logos anywhere.

## Processing

```bash
npx tsx scripts/slice-sprites.ts design/source/bull-sheet.png bull --cols 4 --rows 2
npx tsx scripts/slice-sprites.ts design/source/bear-sheet.png bear --cols 4 --rows 2
npx tsx scripts/slice-sprites.ts design/source/judge-sheet.png judge --cols 4 --rows 2
npx tsx scripts/process-assets.ts
npx tsx scripts/process-logo.ts
```

The podium, desk and microphone shapes that are redrawn in front of the characters, the cut lines and the camera framing are traced from the studio image in `src/components/theatre/stage.tsx`. Regenerating the studio means re-measuring them.
