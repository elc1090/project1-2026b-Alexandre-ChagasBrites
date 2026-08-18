const canvas = document.querySelector("canvas");
const toolBtns = document.querySelectorAll(".tool");
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
    ctx.strokeTyle = selectedColor;
    ctx.fillStyle = selectedColor;
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function drawing(e) {
    if (!isDrawing) return;
    ctx.putImageData(snapshot, 0, 0);

    if (selectedTool === "brush") {
        ctx.lineTo(e.offsetX, e.offsetY);
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

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);
canvas.addEventListener("mouseup", () => isDrawing = false);
