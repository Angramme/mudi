alert(`Use your mouse to rotate the box.
When pressing space at the same time you can zoom in and out,
and when holding numbers on your keypad, you can rotate the box in the chosen dimension.
(for example: press 4 and drag the mouse to rotate around the w axis)`);

let ctx;

window.onload = ()=>{
	ctx = muDi.initializeCanvas()[1];

    let ndim = Infinity;
    do{
        ndim = Number(window.prompt("enter number of dimensions please (smaller than 10 and bigger than 1)\n PS: I would recommend 4 to start with")) |0;
    }while(ndim >= 10 || ndim < 2);

    box = muDi.newBox(new Array(ndim).fill(50),[0,0,65]);

	window.addEventListener("dragAny", e=>{
		if(muDi.keyboard.get("Space")){
			box.position.setDim(2, Math.max( 50, box.position.getDim(2)-e.offsetY*.5 ));
		}else{
			let dimension = 3;
			for(let i=3; i < box.depth+1; i++){
				if( muDi.keyboard.get(`Numpad${i}`) || muDi.keyboard.get(`Digit${i}`) ){
					dimension = i;
					break;
				}
			}
			rotateCam(`0,${dimension-1}`,`1,${dimension-1}`, e);
		}
	})
	function rotateCam(plane1, plane2, e){
		let rotXZ = box.rotation.get(plane1)||0;
		let rotYZ = box.rotation.get(plane2)||0;

		box.rotation.set(plane1,rotXZ + e.offsetX*.005);
		box.rotation.set(plane2,rotYZ + e.offsetY*.005);
		rotYZ = box.rotation.get(plane2);
		box.rotation.set(plane2,rotYZ>Math.PI*.5 ? Math.PI*.5 : rotYZ<-Math.PI*.5 ? -Math.PI*.5 : rotYZ);
	}

	draw();
};

function draw(time){
	ctx.fillStyle = "#5555ff";
	muDi.clearContext();
	ctx.lineWidth = 2;

	/*
	box.rotation.set("0,2", Math.PI*time*.0001);
	box.rotation.set("1,2", Math.PI*.15);
	box.rotation.set("2,3", time*.0015);
	box.rotation.set("1,3", time*.0017);
	*/

	box.rasterize();
	box.drawLines();
	ctx.fillStyle = "red";
	box.drawPoints(4);

	ctx.fillStyle = "#ffffff";
	box.drawDataSheet(12);
	box.drawIndexes(10);

	requestAnimationFrame(draw);
}
