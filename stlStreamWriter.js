const THREE = require('three'),
	  fs = require('fs'),
	  tmp = require('tmp');

function STLStreamWriter() {
	this.numTriangles = 0;
	this.tmpFileName = tmp.tmpNameSync();
	this.wStream = fs.createWriteStream(this.tmpFileName);
	
	var header = new Buffer(84);
	header.fill(0, 0, 80);
	header.write('');
	header.writeUInt32LE(0, 80);
	
	this.wStream.write(header);
}

STLStreamWriter.prototype.write = function(threeGeom) {
	const countTriangles = (geom) => {
		return geom.faces.reduce( (n, face) => n + (face instanceof THREE.Face4 ? 2 : 1), 0 );
	}
	
	const writeFloat = (val) => {
		buff.writeFloatLE(val, offset);
		offset+=4;
    };

    const writeVertex = (vertex) => {
		writeFloat(vertex.x);
		writeFloat(vertex.y);
		writeFloat(vertex.z);
    };

    const writeFace = (face, a, b, c, flipped) => {
		writeVertex(face.normal);
		
		const verts = [a, b, c];
		
		if(flipped) { verts.reverse(); }

		verts.forEach( (v) => writeVertex(v) );

		buff.writeUInt16LE(0, offset);
    	offset+=2;
    };

    const count = countTriangles(threeGeom);
    this.numTriangles += count;

	const buff = new Buffer(count*12*4 + count*2);
	let offset = 0;

    const vertices = threeGeom.vertices;

	threeGeom.faces.forEach((face) => {
		writeFace(face, vertices[face.a], vertices[face.b], vertices[face.c], threeGeom.flipped);

		if(face instanceof THREE.Face4) {
			writeFace(face, vertices[face.c], vertices[face.d], vertices[face.a], threeGeom.flipped);
		}
	});
	
	this.wStream.write(buff);
}

STLStreamWriter.prototype.finish = function(outputFilename) {
	
	this.wStream.end(null, null, ()=>{
		const headerCount = new Buffer(4);
		headerCount.writeUInt32LE(this.numTriangles);
		
		const fd = fs.openSync(this.tmpFileName,'r+');
		fs.writeSync(fd, headerCount, 0, 4, 80);
		fs.closeSync(fd);

		fs.rename(this.tmpFileName, outputFilename);
	});
	
}

module.exports = STLStreamWriter;