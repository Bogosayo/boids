/*** (1) constants ***/
var boid_radius = 25;
var background_color_values = [180, 214, 255];
var pause_screen_tint_values = [0, 32, 24, 126];
var pause_key_value = 32; // spacebar
var line_key_value = 76; // L
var circles_key_value = 67; // C
var triangles_key_value = 84; // T
var not_paused = true;
var draw_lines = false;
var draw_circles = true;
var draw_triangles = false;
var draw_boids = true;
var canvas_height = 500;
var canvas_width = 500;
var pause_rectangle_height = 80;
var pause_rectangle_width = 25;
var fps = 60;
var neighbor_distance = boid_radius * 2.5;
var max_velocity = 7;
var personal_space = boid_radius * 2;
var frames_til_decision = 360;

/*** (3) helper functions ***/
function getRandomNumber(max_number){
	var value = Math.floor(Math.random() * Math.floor(max_number));
	return value;
}

function getRandomNumberInRange(min_number, max_number){
	var value = min_number + Math.floor(Math.random() * Math.floor(max_number - min_number));
	return value;
}

function getRandomColor(){
	var r = getRandomNumberInRange(200, 255);
	var g = getRandomNumberInRange(200, 255);
	var b = getRandomNumberInRange(220, 255);
	return color(r, g, b);
}

function createNewBoid(id, new_x, new_y){
	var obj = {};
	obj.id = id;
	obj.pos = createVector(new_x, new_y);
	obj.velocity = createVector(getRandomNumberInRange(-3, 3), getRandomNumberInRange(-3, 3));
	obj.personal_max_velocity = max_velocity;
	obj.frame_count = 0;
	obj.color = getRandomColor();

	obj.findNeighbors = function(boids_array){
		var neighbors = [];
		var number_boids = boids_array.length;
		for(var i = 0; i < number_boids; i++){
			if(boids_array[i].id != this.id){
				var v = boids_array[i].pos.dist(this.pos)
				if(v < neighbor_distance){
					neighbors.push(boids_array[i]);
					if(draw_lines){
						line(this.pos.x, this.pos.y, boids_array[i].pos.x, boids_array[i].pos.y);
					}
				}
			}
		}
		return neighbors;
	}

	obj.steerToCenter = function(boids_array){
		var number_boids = boids_array.length;
		var force = createVector(0, 0);
		if(number_boids > 0){
			for(var i = 0; i < number_boids; i++){
				force = force.add(boids_array[i].pos);
			}
			force.div(number_boids);
			force.sub(this.pos);
			force.div(100);
		}
		return force;
	}

	obj.steerClear = function(boids_array){
		var number_boids = boids_array.length;
		var force = createVector(0, 0);
		if(number_boids > 0){
			for(var i = 0; i < number_boids; i++){
				var distance_vector = p5.Vector.sub(boids_array[i].pos, this.pos);
				var distance = distance_vector.mag();
				if(distance < personal_space){
					force.sub(distance_vector);
					force.div(distance);
				}
			}
		}
		return force;
	}

	obj.steerSpeed = function(boids_array){
		var number_boids = boids_array.length;
		var velocity = createVector(0, 0);
		if(number_boids > 0){
			for(var i = 0; i < number_boids; i++){
				velocity = velocity.add(boids_array[i].velocity);
			}
			velocity.div(number_boids);
			velocity.sub(this.velocity);
			velocity.div(8);
		}
		return velocity;
	}

	obj.wrapAroundBorder = function(){
 		if(this.pos.x > (canvas_width + 5)){
  			this.pos.x = -5;
  		}
 		if(this.pos.x < -5){
  			this.pos.x = canvas_width;
  		}
 		if(this.pos.y > (canvas_height + 5)){
  			this.pos.y = -5;
  		}
 		if(this.pos.y < -5){
  			this.pos.y = canvas_height + 5;
  		}
	}

	obj.featureCreep = function(){
		this.frame_count = this.frame_count + 1;
		if(this.frame_count > frames_til_decision){
			this.frame_count = 0;
			if(getRandomNumber(4) > 2){
				this.personal_max_velocity = getRandomNumberInRange(Math.floor(max_velocity / 2), max_velocity);
			}
			else {
				this.personal_max_velocity = max_velocity;
			}
		}
	}

	obj.move = function(boids_array){
		var neighbors = this.findNeighbors(boids_array);
		var v1 = this.steerToCenter(neighbors).div(4);
		var v2 = this.steerClear(neighbors).div(1);
		var v3 = this.steerSpeed(neighbors).div(1);
		this.velocity.add(v1);
		this.velocity.add(v2);
		this.velocity.add(v3);
		if(this.velocity.mag() > this.personal_max_velocity){
			this.velocity.normalize();
			this.velocity.mult(this.personal_max_velocity);
		}
 		this.pos.add(this.velocity);
 		this.wrapAroundBorder();
 		//this.featureCreep();
	}

	obj.draw = function(){
		if(draw_circles){
			fill(this.color);
			ellipse(this.pos.x, this.pos.y, boid_radius, boid_radius);
		}
		if(draw_triangles){
			var head_point = createVector(this.velocity.x, this.velocity.y);
			head_point.normalize();
			var left_point = createVector(head_point.y, -head_point.x);
			var right_point = createVector(-left_point.x, -left_point.y);
			head_point.mult(boid_radius);
			var side_length = boid_radius / 4;
			left_point.mult(side_length);
			right_point.mult(side_length);
			head_point.add(this.pos);
			left_point.add(this.pos);
			right_point.add(this.pos);

			fill(this.color);
			triangle(head_point.x, head_point.y, left_point.x, left_point.y, right_point.x, right_point.y);
		}
	}

	return obj;
}

function createBoidContainer(){
	var obj = {};
	obj.boids_array = [];
	obj.total_boids = 0;

	obj.addBoid = function(new_x, new_y){
		this.total_boids = this.total_boids + 1;
		this.boids_array.push(createNewBoid(this.total_boids, new_x, new_y));
	}

	obj.updateBoids = function(){
		var number_boids = this.boids_array.length;
		if(draw_boids){
			for(var i = 0; i < number_boids; i++){
				this.boids_array[i].draw();
			}
		}
		if(not_paused){
			for(var i = 0; i < number_boids; i++){
				this.boids_array[i].move(this.boids_array);
			}
		}
	}

	return obj;
}

/*** (2) global variables ***/
var boid_container;
var background_color;
var pause_screen_tint;
var pause_rectangle_left;
var pause_rectangle_right;

/*** (4) P5 functions **
function mousePressed(){
	boid_container.addBoid(mouseX, mouseY);
}*/

function keyPressed(){
	if(keyCode === pause_key_value){
		not_paused = !not_paused;
	}
	if(keyCode === line_key_value){
		draw_lines = !draw_lines;
	}
	if(keyCode === circles_key_value){
		draw_circles = !draw_circles;
		draw_triangles = false;
		draw_boids = draw_circles;
	}
	if(keyCode === triangles_key_value){
		draw_triangles = !draw_triangles;
		draw_circles = false;
		draw_boids = draw_triangles;
	}
}

function setup() {
	createCanvas(canvas_height, canvas_width);
	frameRate(fps);
	boid_container = createBoidContainer();
	background_color = color(background_color_values);
	pause_screen_tint = color(pause_screen_tint_values);
	pause_rectangle_left = [(canvas_width / 2) - (pause_rectangle_width * 1.5), (canvas_height / 2) - (pause_rectangle_height / 2), pause_rectangle_width, pause_rectangle_height];
	pause_rectangle_right = [(canvas_width / 2), (canvas_height / 2) - (pause_rectangle_height / 2), pause_rectangle_width, pause_rectangle_height];
}

function draw() {
	if(mouseIsPressed){
	boid_container.addBoid(mouseX, mouseY);

	}
	background(background_color);
	boid_container.updateBoids();
	if(!not_paused){
		fill(pause_screen_tint);
		rect(0, 0, canvas_height, canvas_width);
		fill(color(255));
		rect(pause_rectangle_left[0], pause_rectangle_left[1], pause_rectangle_left[2], pause_rectangle_left[3], 20);
		rect(pause_rectangle_right[0], pause_rectangle_right[1], pause_rectangle_right[2], pause_rectangle_right[3], 20);
	}
}