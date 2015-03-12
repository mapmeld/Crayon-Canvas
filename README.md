<a href="http://crayonmap.heroku.com">Crayon Vector</a>
---
Based on Crayon Canvas, an art library to make items in the HTML5 <canvas> element as if they were drawn in crayon
Screenshot using the OpenStreetMap tool:

<img src="http://i.imgur.com/peVteJK.png"/>

---

Crayon Canvas (JavaScript)
- The library to draw lines and polygons in crayon
- drawLine, which connects two points using a crayon-like style and a given color
- drawShape, which connects vertices with drawLine, then fills in the space with a zig-zag, crayon-like pattern

<img src="http://i.imgur.com/CYQFF3N.png"/>

--

index.php / viewer
- Static file for Heroku to show map
- PHP proxy to load GeoJSON layers from OpenStreetMap.us