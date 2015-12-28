// ---- customizoble vars

var dice_size = 7, coin_size = 10, coin_thickness = 0.6, time_unit = 1/60;
var dice_position = [-30, 20, 50], camera_position = [0, 100, 0];

var dice_intial_velocity_gen = function(){
    return [ (40 - 20) * Math.random() + 20,
             (40 - 20) * Math.random() + 20,
             ((-70) - (-30)) * Math.random() + (-30) ];
}

var dice_angular_velocity_gen = function(){
    return [ Math.random() < 0.5 ? 8 : -8,
             Math.random() < 0.5 ? 8 : -8,
             Math.random() < 0.5 ? 8 : -8 ];
}

var coin_intial_velocity_gen = function(){
    return [ (30 - 20) * Math.random() + 20,
             (90 - 60) * Math.random() + 60,
             ((-50) - (-30)) * Math.random() + (-30) ];
}

var coin_angular_velocity_gen = function(){
    return [ (Math.random() < 0.5 ? 1 : -1) * (Math.random() * 5 + 5), 0, 0 ];
}

// ---- world

var cannon_world, three_scene, three_renderer, three_camera, objects;

function world_initialize($dom, w, h)
{
    var ground_body, ground_obj;

    objects = [];

    // cannon world
    cannon_world = new CANNON.World();
    cannon_world.gravity.set(0, -90.82, 0);
    cannon_world.broadphase = new CANNON.NaiveBroadphase();
    cannon_world.solver.iterations = 10;
    cannon_world.solver.tolerance = 0.001;
    cannon_world.allowSleep = true;

    // three scene
    three_scene = new THREE.Scene();

    // three camera
    // three_camera = new THREE.OrthographicCamera(1, 1, 1, 1, 0.1, 100);
    three_camera = new THREE.PerspectiveCamera(60, w/h, 0.1, 1000);
    three_camera.position.set(camera_position[0], camera_position[1], camera_position[2]);
    three_camera.lookAt(new THREE.Vector3(0, 0, 0));
    three_scene.add(three_camera);

    // three renderer
    three_renderer = new THREE.CSS3DRenderer();
    three_renderer.setSize(w, h);
    $dom.append(three_renderer.domElement);

    // ground
    ground_body = new CANNON.RigidBody(0, new CANNON.Plane());
    ground_body.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0), - Math.PI / 2);
    cannon_world.add(ground_body);

    // // ground (visible)
    // ground_obj = new THREE.CSS3DObject(document.createElement('div'));
    // ground_obj.element.style.width = "800px"
    // ground_obj.element.style.height = "800px"
    // ground_obj.element.style.backgroundColor = "black"
    // ground_obj.position.fromArray([0, 0, 0]);
    // ground_obj.rotation.fromArray([Math.PI/2, 0, 0]);
    // three_scene.add(ground_obj);
}

// ---- dice

function add_dice()
{
    var boxInfo = [
        { url:'img/dice_2.png', position:[-dice_size,0,0], rotation:[0,Math.PI/2,0] },
        { url:'img/dice_5.png', position:[dice_size,0,0], rotation:[0,-Math.PI/2,0] },
        { url:'img/dice_1.png', position:[0,dice_size,0], rotation:[Math.PI/2,0,Math.PI] },
        { url:'img/dice_6.png', position:[0,-dice_size,0], rotation:[-Math.PI/2,0,Math.PI] },
        { url:'img/dice_3.png', position:[0,0,dice_size], rotation:[0,Math.PI,0] },
        { url:'img/dice_4.png', position:[0,0,-dice_size], rotation:[0,0, 0] }
    ];

    var dice_obj, dice_box, dice_body;

    // cannon
    var vel = dice_intial_velocity_gen();
    var avel = dice_angular_velocity_gen();
    dice_box = new CANNON.Box(new CANNON.Vec3(dice_size, dice_size, dice_size));
    dice_body = new CANNON.RigidBody(1, dice_box);
    dice_body.angularDamping = 0.001;
    dice_body.position.set(dice_position[0], dice_position[1], dice_position[2]);
    dice_body.velocity.set(vel[0], vel[1], vel[2]);
    dice_body.angularVelocity.set(avel[0], avel[1], avel[2]);
    cannon_world.add(dice_body);

    // three
    dice_obj = new THREE.CSS3DObject(document.createElement('div'));
    dice_obj.allowSleep = true;
    dice_obj.sleepSpeedLimit = 0.1;
    dice_obj.sleepTimeLimit = 1;
    for(var j = 0; j < boxInfo.length; j++){
        var info, img, face;
        info = boxInfo[j];
        img = document.createElement('img');
        img.width = dice_size * 2;
        img.src = info.url;
        face = new THREE.CSS3DObject(img);
        face.position.fromArray(info.position);
        face.rotation.fromArray(info.rotation);
        dice_obj.add(face);
    }
    three_scene.add(dice_obj);

    // push
    objects.push({ rigid: dice_body, mesh: dice_obj  });
}

// ---- coin

function add_coin()
{
    var faceInfo = [
        { url:'img/coin_down.png', position:[0, 0, coin_thickness * 4 / 4] },
        { url:'img/coin_inside.png', position:[0, 0, coin_thickness * 3 / 4] },
        { url:'img/coin_inside.png', position:[0, 0, coin_thickness * 2 / 4] },
        { url:'img/coin_inside.png', position:[0, 0, coin_thickness * 1 / 4] },
        { url:'img/coin_inside.png', position:[0, 0, 0] },
        { url:'img/coin_inside.png', position:[0, 0, - coin_thickness * 1 / 4] },
        { url:'img/coin_inside.png', position:[0, 0, - coin_thickness * 2 / 4] },
        { url:'img/coin_inside.png', position:[0, 0, - coin_thickness * 3 / 4] },
        { url:'img/coin_up.png', position:[0, 0, - coin_thickness * 4 / 4] }
    ];

    var coin_obj, coin_cylinder, coin_body;

    // cannon
    var vel = coin_intial_velocity_gen();
    var avel = coin_angular_velocity_gen();
    coin_cylinder = new CANNON.Cylinder(coin_size, coin_size, coin_thickness, 10);
    coin_body = new CANNON.RigidBody(1, coin_cylinder);
    coin_body.angularDamping = 0.001;
    coin_body.position.set(dice_position[0], dice_position[1], dice_position[2]);
    coin_body.velocity.set(vel[0], vel[1], vel[2]);
    coin_body.angularVelocity.set(avel[0], avel[1], avel[2]);
    cannon_world.add(coin_body);

    // three
    coin_obj = new THREE.CSS3DObject(document.createElement('div'));
    coin_obj.allowSleep = true;
    coin_obj.sleepSpeedLimit = 0.1;
    coin_obj.sleepTimeLimit = 1;
    for(var i = 0; i < faceInfo.length; i++)
    {
        var tmp = document.createElement('img');
        tmp.width = coin_size * 2;
        tmp.src = faceInfo[i].url;
        var face = new THREE.CSS3DObject(tmp);
        face.position.fromArray(faceInfo[i].position);
        face.rotation.fromArray([0, 0, 0]);
        coin_obj.add(face);
    }
    three_scene.add(coin_obj);

    // push
    objects.push({ rigid: coin_body, mesh: coin_obj  });
}

// ---- animation

var animation_no_nextframe = false

function animation_frame()
{
    if(!animation_no_nextframe)
        requestAnimationFrame(animation_frame);

    cannon_world.step(time_unit);

    for(var i = 0; i < objects.length; i++){
        objects[i].rigid.position.copy(objects[i].mesh.position);
        objects[i].rigid.quaternion.copy(objects[i].mesh.quaternion);
    }

    three_renderer.render(three_scene, three_camera);
}

function animation_start()
{
    animation_no_nextframe = false;
    animation_frame();
}

// ---- initialize

function dice_initialize($dom, w, h)
{
    world_initialize($dom, w, h);
    add_dice();
    animation_start();
}

function coin_initialize($dom, w, h)
{
    world_initialize($dom, w, h);
    add_coin();
    animation_start();
}

function animation_stop()
{
    animation_no_nextframe = true;
}
