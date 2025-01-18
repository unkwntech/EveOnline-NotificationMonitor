function randomString(length) {
    let output = "";
    let characterPool = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < length; i++) {
        output += characterPool.charAt(
            Math.floor(Math.random() * characterPool.length)
        );
    }

    return output;
}

let codes = [];
let i = 0;
while (true) {
    let code = randomString(8);
    if (codes.includes(code)) console.log("COLLISION");
    else codes.push(code);
    i++;
    if (i % 5000 === 0) {
        console.log(i);
    }
}
