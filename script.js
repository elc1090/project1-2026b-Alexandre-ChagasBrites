const canvas = document.querySelector("canvas");
const toolBtns = document.querySelectorAll(".tool");
const colorBtns = document.querySelectorAll(".colors li");
ctx = canvas.getContext("2d");

let prevMouseX = undefined;
let prevMouseY = undefined;
let snapshot = undefined;
let isDrawing = false;
let selectedTool = "";
let selectedColor = "#000000";
let brushWidth = 5;

window.addEventListener("load", () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
});

function startDraw(e) {
    isDrawing = true;
    prevMouseX = e.offsetX;
    prevMouseY = e.offsetY;
    ctx.beginPath();
    ctx.lineWidth = brushWidth;
    ctx.strokeStyle = selectedTool === "eraser" ? "black" : selectedColor;
    ctx.fillStyle = selectedColor;
    ctx.globalCompositeOperation = selectedTool === "eraser" ? "destination-out" : "source-over";
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function drawing(e) {
    if (!isDrawing) return;
    ctx.putImageData(snapshot, 0, 0);

    if (selectedTool === "brush" || selectedTool === "eraser") {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    } else if (selectedTool === "spray") {
        for (let i = 0; i < 10; i++) {
            let radius = Math.sqrt(Math.random()) * 10.0;
            let angle = Math.random() * 2 * Math.PI;
            let x = Math.floor(e.offsetX + Math.cos(angle) * radius);
            let y = Math.floor(e.offsetY + Math.sin(angle) * radius);
            if (x >= 0 && x < snapshot.width && y >= 0 && y < snapshot.height) {     
                snapshot.data[(x + y * snapshot.width) * 4 + 0] = 0;
                snapshot.data[(x + y * snapshot.width) * 4 + 1] = 0;
                snapshot.data[(x + y * snapshot.width) * 4 + 2] = 0;
                snapshot.data[(x + y * snapshot.width) * 4 + 3] = 255;
            }
        }
    } else if (selectedTool === "eyedropper") {
        let x = Math.floor(e.offsetX);
        let y = Math.floor(e.offsetY);
        if (x >= 0 && x < snapshot.width && y >= 0 && y < snapshot.height) {     
            let r = snapshot.data[(x + y * snapshot.width) * 4 + 0];
            let g = snapshot.data[(x + y * snapshot.width) * 4 + 1];
            let b = snapshot.data[(x + y * snapshot.width) * 4 + 2];
            let a = snapshot.data[(x + y * snapshot.width) * 4 + 3];
            const toHex = (num) => num.toString(16).padStart(2, '0');
            selectedColor = `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
            console.log(selectedColor);
        }
    } else if (selectedTool === "line") {
        ctx.beginPath();
        ctx.moveTo(prevMouseX, prevMouseY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    } else if (selectedTool === "rectangle") {
        ctx.strokeRect(prevMouseX, prevMouseY, e.offsetX - prevMouseX, e.offsetY - prevMouseY);
    } else if (selectedTool === "circle") {
        ctx.beginPath();
        let radius = Math.sqrt((e.offsetX - prevMouseX) * (e.offsetX - prevMouseX) + (e.offsetY - prevMouseY) * (e.offsetY - prevMouseY));
        ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI);
        ctx.stroke();
    } else if (selectedTool === "polygon") {
        ctx.beginPath();
        let radius = Math.sqrt((e.offsetX - prevMouseX) * (e.offsetX - prevMouseX) + (e.offsetY - prevMouseY) * (e.offsetY - prevMouseY));
        let offset = Math.atan2(e.offsetY - prevMouseY, e.offsetX - prevMouseX);
        for (let i = 0; i < 5; i++) {
            let angle = offset + i / 5 * 2 * Math.PI;
            let x = prevMouseX + Math.cos(angle) * radius;
            let y = prevMouseY + Math.sin(angle) * radius;
            i == 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }
}

toolBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        document.getElementById(selectedTool)?.classList.remove("active");
        btn.classList.add("active");
        selectedTool = btn.id;
    });
});

colorBtns.forEach(btn => {

});

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);
canvas.addEventListener("mouseup", () => isDrawing = false);
