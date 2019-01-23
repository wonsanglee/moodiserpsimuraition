var o = {} // empty Object
var key = 'Orientation Sensor';
o = []; // empty Array, which you can push() values into


var data = {
    sampleTime: '1450632410296',
    data: '76.36731:3.4651554:0.5665419'
};
var data2 = {
    sampleTime: '1450632410296',
    data: '78.15431:0.5247617:-0.20050584'
};
o.push(data);
o.push(data2);
console.log(o);

var x = o[0];
console.log(x);
console.log(x['sampleTime']);
//console.log(o[0].get("sampletime"));