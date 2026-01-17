// In SceneManager.render():

// Rotate the shell (continents) normally
this.earthGroup.children[1].rotation.y += 0.0005; // earthShell

// Rotate the grid slightly faster or slower to create a "scanning" interference effect
this.earthGroup.children[2].rotation.y -= 0.0002; // earthGrid
