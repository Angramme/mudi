const muDi = new (class MUDI{
	constructor(){
		this.FOV = 200;
		this.canvas = null;
		this.context = null;

		this.setupKeyboard();

		console.log(`
			this project runs on
			muDi.js: Multi Dimensional Engine
			created by Kacper Ozieblowski 2017`
		.replace(/^\s+|\s+$/gm, ""));
	}

	get canWidth(){ return this.canvas ? this.canvas.width : window.innerWidth }
	get canHeight(){ return this.canvas ? this.canvas.height : window.innerHeight }
	get CTX(){ return this.context ? 
		this.context : 
		(()=>{throw new Error("you did't pass the context as an argument!")})() 
	}

	initializeCanvas(){
		this.canvas = document.createElement("canvas");
		document.body.appendChild(this.canvas); 
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.canvas.style.cursor = "all-scroll";
		document.body.style.margin = "0";
		document.body.style.overflow = "hidden";

		this.context = this.canvas.getContext("2d");
		window.addEventListener("resize",()=>{
			this.canvas.width = window.innerWidth;
			this.canvas.height = window.innerHeight;
		}, true);

		this.setupDragEvent();
		return [this.canvas, this.context]
	}

	clearContext(){
		this.context.fillRect(0,0,this.canvas.width,this.canvas.height);
	}

	//constructors
	newBox(dim, pos=[0,0,0]){
		let box = new Mesh();
		box.vertices = Mesh.newBoxVertices(dim);
		box.lines = Mesh.newBoxLines(dim);
		box.position.set(pos);
		box.rasterize();
		return box;
	}

	//events
	setupDragEvent(){
		if(this.Event){return false}
		this.Event = new CustomEvent("dragAny");
		this.Event.onMup = e=>{
		this.Event.mPressed = false;
			window.removeEventListener("mouseup", this.Event.onMup, false);
			muDi.canvas.removeEventListener("mousemove", this.Event.onMmove, false);
		}
		this.Event.onMmove = e=>{
			this.Event.clientX = e.clientX;
			this.Event.clientY = e.clientY;
			this.Event.offsetX = e.clientX - this.Event.prevMx;
			this.Event.offsetY = e.clientY - this.Event.prevMy;
			window.dispatchEvent(this.Event);
			this.Event.prevMx = this.Event.clientX;
			this.Event.prevMy = this.Event.clientY;
		}
		muDi.canvas.addEventListener("mousedown", e=>{
			this.Event.mPressed = true;
			this.Event.prevMx = e.clientX;
			this.Event.prevMy = e.clientY;
			window.addEventListener("mouseup", this.Event.onMup, false);
			muDi.canvas.addEventListener("mousemove", this.Event.onMmove, false);
		},false);
	}
		
	setupKeyboard(){
		if(this.keyboard){return false}
		this.keyboard = new Map();
		window.addEventListener("keydown", e=>{
			this.keyboard.set(e.code, true)
		},false);
		window.addEventListener("keyup", e=>{
			this.keyboard.set(e.code, false)
		},false);
	}
})();

class Mesh{
	constructor(){
		this.vertices = [];
		this.verts = []; //camera modified
		this.lines = [];

		this.position = new Vec([]);
		this.rotation = new Map();
	}

	rasterize(){
		this.verts = this.vertices.map(oldVec => oldVec.clone() );
		this.rotation.forEach((angle,planeStr) =>{
			let plane = planeStr.split(",");
			this.rotate( plane[0], plane[1], angle ); 
		},this);
		this.verts.map(vert => vert.add(this.position.pos).rasterize() );
	}

	rotate(dim1, dim2, angle){
		if( dim1 == dim2 ) throw new Error('cannot rotate on plane of the same axis!');
		const COS = Math.cos(angle);
		const SIN = Math.sin(angle);
		this.verts = this.verts.map(vert =>
			vert.clone()
			.setDim( dim1, vert.pos[dim1]*COS - vert.pos[dim2]*SIN )
			.setDim( dim2, vert.pos[dim2]*COS + vert.pos[dim1]*SIN )
		);
	}

	move(numArray){
		this.position.add(numArray);
	}
	
	get depth(){ return this.vertices[0].depth }
	
	drawPoints(pointRadius=6, context =muDi.CTX, vw = muDi.canWidth, vh = muDi.canHeight){
		context.translate(vw*.5, vh*.5);
		for( let i=0; i<this.verts.length; i++ ){
			this.verts[i].drawPoint(context, pointRadius); 
		}
		context.translate(-vw*.5, -vh*.5);
	}

	drawLines(context =muDi.CTX, vw = muDi.canWidth, vh = muDi.canHeight){
		context.translate(vw*.5, vh*.5);

		this.lines.forEach(line =>{
			let vert1 = this.verts[line[0]];
			let vert2 = this.verts[line[1]];
			context.beginPath();
			context.moveTo(vert1.x, vert1.y);
			context.lineTo(vert2.x, vert2.y);
			context.stroke();
		}, this);
		context.translate(-vw*.5, -vh*.5);
	}

	drawIndexes(fontSize, context =muDi.CTX, vw = muDi.canWidth, vh = muDi.canHeight){
		context.font = `${fontSize}px Arial`;

		context.translate(vw*.5, vh*.5);
		for( let i=0; i<this.verts.length; i++ ){
			let v = this.verts[i];
			context.fillText(i, v.x, v.y-fontSize*.5);
		}
		context.translate(-vw*.5, -vh*.5);
	}

	drawDataSheet(fontSize=15, context =muDi.CTX, x=10,y=10){
		const lineHeight = fontSize*1.2;
		x += 10;
		let Y = y+fontSize;
		context.font = `${fontSize}px Arial`;
		context.fillText("a "+this.vertices[0].depth + "D cube projection.", x, Y);
		context.fillText("Composed of "+this.vertices.length+ " vertices", x, Y+=lineHeight);
		Y += lineHeight*.5;
		const letters = "xyzwvutsrqponmlkjihgfedcba";
		const toStr = n => letters[n%letters.length];
		this.rotation.forEach((angle, axis) => {
			Y += lineHeight;
			context.fillText(`rotated by ${String(angle).padEnd(6,0).slice(0,6)} radians on ${String(axis.split(",").map(toStr))} plane`, x, Y);
		});
		let tempCol = context.strokeStyle;
		let tempLWid = context.lineWidth;
		context.strokeStyle = context.fillStyle;
		context.lineWidth = 1;
		context.beginPath();
		context.moveTo(x-10,y);
		context.lineTo(x-10,Y+5);
		context.stroke();
		context.strokeStyle = tempCol;
		context.lineWidth = tempLWid;
	}

	//geometry creator functions:
	static newBoxVertices(dim){
		var Out = [new Vec(dim.length)];

		dim.forEach((val, i) => {
			let New = Out.map(oldVec => oldVec.clone());
			Out.map(elmnt => elmnt.setDim(i, val*.5) );
			New.map(elmnt => elmnt.setDim(i,-val*.5) );

			Out = Out.concat(New);
		});
		return Out;
	}

	static newBoxLines(dim){
		let depth = dim.length;
		let vertCount = 2;
		let Out = [[0,1]]
		for(let i=1; i<depth; i++){
			let New1 = Out.map(val => [
				val[0] + vertCount,
				val[1] + vertCount,
			]);
			let New2 = new Array(vertCount).fill(0).map((val,i) => [
				i,
				i+vertCount,
			]);
			Out = Out.concat(New1).concat(New2);
			vertCount *= 2;
		}
		return Out;
	}
}


class Vec{
	constructor(posArray=2){
		if(typeof posArray != "object") this.pos = new Array(Number(posArray)).fill(0);
		else this.pos = posArray;
	}

	get depth(){
		return this.pos.length
	}

	setDim(i, val){
		this.pos[i] = val;
		return this
	}

	getDim(i){
		return this.pos[i];
	}

	set(numArray){
		this.pos = numArray;
		return this
	}

	add(numArray){
		this.pos = this.pos.map((val,i) => val + (numArray[i] || 0));
		return this
	}

	sub(numArray){
		this.pos = this.pos.map((val,i) => val - (numArray[i] || 0));
		return this
	}

	rasterize(){
		let Pos = this.pos.slice(); //copy
		for(let ind = Pos.length-1; ind > 1; ind--){
			const val = Pos[ind];

			if(val <= 0 && ind == 1){
				this.x = this.y = 0;
				return this;
			}
			let f = muDi.FOV / val;
			for( let I = ind-1; I > -1; I-- ){
				Pos[I] *= f;
			}
		};
		[this.x, this.y] = Pos;
		return this;
	}

	clone(){
		return new Vec(this.pos.slice());
	}

	drawPoint(context, r){
		//context.fillRect(this.x-3, this.y-3 || 0, 6,6);

		context.beginPath();
		context.arc(this.x,this.y,r,0,2*Math.PI);
		context.fill();
	}
}


