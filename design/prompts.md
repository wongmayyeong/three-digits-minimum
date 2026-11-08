# Graphics prompts (ChatGPT image generation)

All character art, the debate stage and the logo mark are AI-generated with ChatGPT from the prompts below, then sliced and integrated by `scripts/slice-sprites.ts`. Disclosed here and in the README as the hackathon rules require.

Design constraints applied to every prompt:
- No text, no product name, and **no NEAR logo** (this is an independent thesis, not an official NEAR product). The central emblem is a neutral four-point "evidence spark".
- Palette: near-black `#060A08`, NEAR-inspired mint `#00EC97` (Bull and the product accent), coral `#FF7966` (Bear), warm white `#F2F1E9`.
- Characters: 16-bit pixel art, consistent across all frames so they can be animated by frame swaps.

## Characters (one sprite sheet each)

Shared layout text, appended to each character prompt:

> Pixel-art character sprite sheet on a single flat solid magenta (#FF00FF) background. Exactly 6 frames in a 3-column by 2-row grid of equal cells. Identical character design, size, position and framing in every cell; only the expression and small gestures change. Row 1: (1) neutral, mouth closed; (2) talking, mouth clearly open; (3) thinking, hand on chin, eyes looking up. Row 2: (4) surprised, eyes wide, mouth round; (5) agreeing, small smile, slight nod; (6) disagreeing, frown, brows lowered. 16-bit retro pixel art, crisp hard pixel edges, limited palette, bust from mid-chest up. No text, no labels, no grid lines, no logos, no letters.

1. **Bull:** an anthropomorphic bull financial analyst with brown fur and cream curved horns, wearing a black suit, white shirt and mint-green tie, a confident expression, facing three-quarter to the right, subtle mint (#00EC97) rim light.
2. **Bear:** an anthropomorphic brown bear analyst with thin rectangular glasses, black suit, white shirt and coral-red tie, a skeptical expression, facing three-quarter to the left, subtle coral (#FF7966) rim light.
3. **Judge:** a wise owl judge with brown and cream feathers and round gold spectacles, wearing a black judge's robe with gold trim and a small gold four-pointed-star badge (no letters), facing the viewer, hands clasped, calm expression.

## Debate stage

> Wide 16:9 dark television debate studio, empty (no people or animals), 16-bit pixel art matching retro game backgrounds. Three podiums: left podium with mint-green (#00EC97) light strips, a raised center judge's desk, right podium with coral (#FF7966) light strips. Behind the center desk, a tall glowing mint light pillar with a simple four-pointed star emblem (no letters, no logo). A large screen on the left shows a rising green candlestick chart; a large screen on the right shows a falling red candlestick chart. Near-black background (#060A08), ceiling lights, reflective floor, cinematic but calm. Leave the lower third and the three podium areas uncluttered so characters can be placed in front. No text, no words, no logos anywhere.

## Logo mark

> Minimal flat logo mark, no text: a bull head silhouette in mint (#00EC97) on the left and a bear head silhouette in coral (#FF7966) on the right, facing each other, separated by a thin diagonal white slash. Clean vector style, bold simple shapes that stay readable at 16 pixels, centered on a flat near-black (#060A08) square background.
