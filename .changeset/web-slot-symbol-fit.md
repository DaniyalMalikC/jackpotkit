---
'@jackpotkit/react': patch
---

Stop default Slot Machine symbol text from clipping in narrow reels. Symbol labels were sized from
the cell height only, so text labels such as `Symbol 1` clipped at a 380px-wide, 3-reel layout. The
default `symbol.label ?? symbol.id` text now also shrinks to the width of its reel cell, using CSS
container query units, and a multi-word label may wrap onto two lines when the cell is tall enough.
Short labels and emoji keep their previous size. Browsers without container query units keep the
previous height-based size. Custom `renderSymbol` output and its cell are unchanged, and the API is
unchanged.
