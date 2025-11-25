# @pronotron/parallax-scene-js

## 3.0.2

### Patch Changes

- fbdca4e: 
  - Refactored the basic load system to use group-level progress and simplify its structure.
  - Added missing settings to the README and fixed indentation.
  - Improved Buffer attribute classes.

## 3.0.1

### Patch Changes

- a9a1941: Completed all planned improvements and resolved several bugs for increased stability.

## 3.0.0

### Major Changes

1a10aee:

- Added NPM support. The library is now installable via npm.
- Implemented VAO (Vertex Array Object) for improved WebGL performance and cleaner attribute binding.
- Added multi-scene rendering. Multiple parallax scenes can now render on the same canvas.
- Introduced onLoad event system. Supports both chunk based and item count based loading callbacks.
- Integrated skyline texture packing algorithm for optimized texture atlas generation.
