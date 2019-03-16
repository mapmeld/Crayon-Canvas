// Crayon Canvas
// MIT licensed on GitHub https://github.com/mapmeld/Crayon-Canvas

// prereqs:
// set the canvas background-color to #fffacd or change #fffacd throughout this file

// drawLine: draw a line on the canvas in crayon
// ctx is the 2d context of the canvas to draw on
// setx1, sety1, setx2, and sety2 should be integer pixels on the canvas
// lineColor and shadeColor should be valid colors for canvas context strokeStyle
// the effect is best if lineColor is bold and shadeColor is a lighter shade of the same color
// specialOrders can be used to change the style of the line. Currently supports "big" or "dashed". If no orders, set to null

function drawLine(ctx, setx1,sety1,setx2,sety2,lineColor,shadeColor,specialOrders){
	// set up the coordinates to draw all lines from left to right
	var x1,x2,y1,y2;
	if(setx1 <= setx2){
		x1 = Math.round(setx1);
		y1 = Math.round(sety1);
		x2 = Math.round(setx2);
		y2 = Math.round(sety2);
	}
	else{
		x1 = Math.round(setx2);
		y1 = Math.round(sety2);
		x2 = Math.round(setx1);
		y2 = Math.round(sety1);
	}
	var ymax = Math.max(y1, y2);
	var ymin = Math.min(y1, y2);
	
	// ready randomized start and end of individual pieces
	var progy = y1;
	var endprogy;

	// ready alternator for dashed lines
	var dashed = 5;

	// draw the line in 5 x-pixel intervals, composed of a thin strong line plus upper and lower strokes
	for(var progx = x1; progx < x2 + 5; progx += 5){
		// fuzz start and end of the line segment
		endprogy = Math.min(Math.round((y2-y1)/(x2-x1)*(progx-x1) + y1 + 3 - 5 * Math.random()), ymax);
		endprogy = Math.max(ymin, endprogy);
		engprogx = Math.min(progx + 5, x2 + 2);
		var randomizer = Math.random();
		
		// alternates to draw blanks for 2 / 7 of a dashed line's path
		if(specialOrders == "dashed"){
			dashed--;
			if(dashed <= 0){
				ctx.closePath();
				if(dashed < -2){
					dashed = 5;
				}
				ctx.strokeStyle = "#fffacd"; 
			}
		}
		
		// 20% chance of not drawing the central line segment
		if(randomizer < 0.95){
			ctx.beginPath();
			if(dashed > 0){ // avoid resetting color during the blank parts of a dashed line
				ctx.strokeStyle = lineColor;
			}
			if(specialOrders == "big"){
				// draw a thicker line segment if requested
				ctx.lineWidth = 8;
			}
			else{
				ctx.lineWidth = 1;
			}
			ctx.moveTo(progx, progy);
			ctx.lineTo(engprogx, endprogy);
			ctx.stroke();
		}
		ctx.beginPath();
		if(dashed > 0){ // avoid resetting color during the blank parts of a dashed line
			ctx.strokeStyle = shadeColor;
		}
		// 80% chance of the upper and lower segments having width of 2
		if(randomizer > 0.2){
			ctx.lineWidth = 2;
		}
		else{
			ctx.lineWidth = 1;		
		}
		// 85% chance of drawing upper segment
		if(randomizer < 0.85){
			ctx.moveTo(progx-Math.round(Math.random()*2)+1, progy+2);
			ctx.lineTo(engprogx-Math.round(Math.random()*2)+1, endprogy+2);
			ctx.stroke();
		}
		// 90% chance of drawing lower segment
		if(randomizer > 0.1){
			ctx.moveTo(progx-Math.round(Math.random()*2)+1, progy-2);
			ctx.lineTo(engprogx-Math.round(Math.random()*2)+1, endprogy-2);
			ctx.stroke();
		}
		// random vertical jots in the segment should be met by the next segment
		progy = endprogy;
	}
}

// drawShape: outline and color in a polygonal shape
// ctx is the 2d context of the canvas to draw on
// points should be an array of [x,y] vertices. For example: [ [10,30], [40,31], [25,45] ]
// lineColor and shadeColor should be valid colors for canvas context strokeStyle
// the effect is best if lineColor is bold and shadeColor is a lighter shade of the same color

function drawShape(ctx, points,lineColor,shadeColor){
	// draw the standard canvas shape to clear the area which is about to be shaded in
	var firstpt = points[0];
        if (!firstpt || !firstpt.length) {
          return;
        }
	ctx.fillStyle = "#ffe";
	ctx.beginPath();
	ctx.moveTo(firstpt[0], firstpt[1]);
	for(var pt=0;pt<points.length-1;pt++){
		var firstpt = points[pt];
		var nextpt = points[pt+1];
		ctx.lineTo(nextpt[0], nextpt[1]);
	}
	ctx.closePath();
	ctx.fill();

	// draw outline
	// and determine the box which contains the shape
	var minx,maxx,miny,maxy;
	minx = points[0][0];
	maxx = points[0][0];
	miny = points[0][1];
	maxy = points[0][1];

	for(var pt=0;pt<points.length-1;pt++){
		drawLine(ctx, points[pt][0],points[pt][1],points[pt+1][0],points[pt+1][1],lineColor,shadeColor,null);

		// update box to contain this vertex
		minx = Math.min(points[pt][0],minx);
		miny = Math.min(points[pt][1],miny);
		maxx = Math.max(points[pt][0],maxx);
		maxy = Math.max(points[pt][1],maxy);		
	}

	// if the shape is short (height < 80 pixels) shade with twice the density
	var zoomfactor = 1;
	if(maxy - miny < 80){
		zoomfactor = 0.5;
	}
	
	//draw inner shading
	for(var drawy = miny; drawy < maxy; drawy += 14 * zoomfactor){
		if(drawy < -10 || drawy > 510){
			// skip offscreen y's
			continue;
		}
		// calculate zig-zag shade points from left and right edges
		var startdraw = null;
		var enddraw = null;
		var startright = null;
		var endright = null;

		// calculate where to draw a left-to-right shader line with this Y-value
		for(var drawx=minx; drawx<maxx; drawx+=5){
			// find the left-most point on the shape at this Y-value
			if(!startdraw){
				if(shapeHoldsPt(points, [drawx, drawy])){
					startdraw = drawx;
				}
			}
			// then find the next edge on the shape at this Y-value, to end shader lines
			else if(!enddraw){
				if(!shapeHoldsPt(points, [drawx, drawy])){
					enddraw = drawx;
					break;
				}
			}
		}
		// Note that in an M shape, the right peak of the M would be missed by the left-to-right shader
		// determine if adding a right-to-left shader would be helpful at this Y-value
		for(var drawx=maxx; drawx>minx; drawx-=5){
			if(enddraw && drawx < enddraw){
				// if right-to-left shader would cover the same region as the left-to-right shader at this Y-value, skip it
				break;
			}
			// find the right-most point on the shape at this Y-value
			if(!startright){
				if(shapeHoldsPt(points, [drawx, drawy])){
					startright = drawx;
				}
			}
			// then find the next edge on this shape at this Y-value, to end shader lines
			else if(!endright){
				if(!shapeHoldsPt(points, [drawx, drawy])){
					endright = drawx;
					break;
				}
			}
		}
		// make the left-to-right shader line
		if(startdraw && enddraw || startdraw && !enddraw && !endright){
		    if(!enddraw){
		      enddraw = maxx;
		    }
			// draw a diagonal line from the left edge, \ to the right edge
			drawLine(ctx, startdraw, drawy, enddraw, drawy + 6 * zoomfactor, shadeColor, shadeColor, null);
			// if there is space before reaching the bottom of the shape, draw / back to the left edge
			if(maxy > drawy + 12 * zoomfactor){
				drawLine(ctx, enddraw, drawy + 6 * zoomfactor, startdraw, drawy + 12 * zoomfactor, shadeColor, shadeColor, null);		
			}
		}
		// make the right-to-left shader line
		if(startright && endright){
			// draw a diagonal line from the right edge, / to the left edge
			drawLine(ctx, startright, drawy, endright, drawy + 6 * zoomfactor, shadeColor, shadeColor, null);
			// if there is space before reaching the bottom of the shape, draw \ back to the right edge
			if(maxy > drawy + 12 * zoomfactor){
				drawLine(ctx, endright, drawy + 6 * zoomfactor, startright, drawy + 12 * zoomfactor, shadeColor, shadeColor, null);		
			}
		}
	}
}

// shape in polygon test
function shapeHoldsPt(poly, pt){
	// determine if the point is contained within a shape
	for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
		((poly[i][1] <= pt[1] && pt[1] < poly[j][1]) || (poly[j][1] <= pt[1] && pt[1] < poly[i][1]))
		&& (pt[0] < (poly[j][0] - poly[i][0]) * (pt[1] - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0])
		&& (c = !c);
	return c;
}
