const toolBtns = document.querySelectorAll(".tool");
const lineWidthInput = document.getElementById("lineWidth");
const fillPathInput = document.getElementById("fillPath");
const colorBtns = document.querySelectorAll(".colors li");
const colorText = document.getElementById("color");
const canvasWidthInput = document.getElementById("canvasWidth");
const canvasHeightInput = document.getElementById("canvasHeight");
const resizeCanvasBtn = document.getElementById("resizeCanvas");
const viewport = document.querySelector("main");
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

let prevMouseX = undefined;
let prevMouseY = undefined;
let snapshot = undefined;
let isDrawing = false;
let isDragging = false;
let drawTool = true;
let selectedTool = "";
let selectedColor = "rgb(0,0,0)";
let originalRect = undefined;
let selectedRect = undefined;
let selectedSnapshot = undefined;
let lineWidth = 4;

window.addEventListener("load", () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

    lineWidthInput.value = lineWidth;
    fillPathInput.checked = false;
    colorText.textContent = selectedColor;
    canvasWidthInput.value = canvas.width;
    canvasHeightInput.value = canvas.height;
});

function startDraw(e) {
    prevMouseX = e.offsetX;
    prevMouseY = e.offsetY;
    if (selectedTool === "selection" && selectedRect !== undefined && e.offsetX >= selectedRect.x && e.offsetX < selectedRect.x + selectedRect.w && e.offsetY >= selectedRect.y && e.offsetY < selectedRect.y + selectedRect.h) {
        isDragging = true;
    } else {

        if (selectedTool === "selection") {
            drawTool = false;
            drawing(e);
            drawTool = true;
            snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }

        isDrawing = true;
        ctx.beginPath();
        ctx.moveTo(prevMouseX, prevMouseY);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = selectedTool === "eraser" ? "white" : selectedColor;
        ctx.fillStyle = selectedColor;
        ctx.globalCompositeOperation = selectedTool === "eraser" ? "destination-out" : "source-over";
    }
}

function drawing(e) {
    ctx.putImageData(snapshot, 0, 0);

    viewport.style.cursor = 'crosshair';
    if (!isDrawing) {

        if (selectedTool === "selection" && selectedRect !== undefined) {
            let x = e.offsetX - selectedRect.x;
            let y = e.offsetY - selectedRect.y;
            if (isDragging || (x >= 0 && x < selectedRect.w && y >= 0 && y < selectedRect.h)) {
                viewport.style.cursor = 'move';
            } else if (x >= -16 && x < selectedRect.w + 16 && y >= -16 && y < selectedRect.h + 16) {
                if ((x < 16 && y < 16) || (x > selectedRect.w - 16 && y > selectedRect.h - 16)) viewport.style.cursor = 'nwse-resize';
                else if ((x < 16 && y > selectedRect.h - 16) || (x > selectedRect.w - 16 && y < 16)) viewport.style.cursor = 'nesw-resize';
                else if (x < 0 || x > selectedRect.w) viewport.style.cursor = 'ew-resize';
                else if (y < 0 || y > selectedRect.h) viewport.style.cursor = 'ns-resize';
            }
        }

        if (selectedRect !== undefined) {
            if (selectedSnapshot !== undefined) {
                ctx.globalCompositeOperation = "source-over";
                ctx.clearRect(originalRect.x, originalRect.y, originalRect.w, originalRect.h);
                ctx.drawImage(selectedSnapshot, selectedRect.x, selectedRect.y);
            }

            if (drawTool) {
                ctx.beginPath();
                ctx.lineWidth = 1.0;
                ctx.strokeStyle = "white";
                ctx.globalCompositeOperation = "difference";
                ctx.strokeRect(selectedRect.x, selectedRect.y, selectedRect.w, selectedRect.h);
                ctx.stroke();
            }
        }

        if (drawTool && selectedTool !== "" && selectedTool !== "selection" && selectedTool !== "eyedropper") {
            ctx.beginPath();
            ctx.lineWidth = 1.0;
            ctx.strokeStyle = selectedTool === "eraser" ? "white" : selectedColor;
            ctx.fillStyle = selectedColor;
            ctx.globalCompositeOperation = selectedTool === "eraser" ? "difference" : "source-over";
            ctx.arc(e.offsetX, e.offsetY, lineWidth * 0.5, 0, 2 * Math.PI);
            selectedTool === "eraser" ? ctx.stroke() : ctx.fill();
        }

        return;
    }

    if (selectedTool === "selection") {
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = "white";
        ctx.globalCompositeOperation = "difference";
        ctx.strokeRect(prevMouseX, prevMouseY, e.offsetX - prevMouseX, e.offsetY - prevMouseY);
    } else if (selectedTool === "brush" || selectedTool === "eraser") {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    } else if (selectedTool === "spray") {
        for (let i = 0; i < lineWidth; i++) {
            let radius = Math.sqrt(Math.random()) * lineWidth;
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
            colorText.textContent = selectedColor;
        }
    } else if (selectedTool === "line") {
        ctx.beginPath();
        ctx.moveTo(prevMouseX, prevMouseY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    } else if (selectedTool === "rectangle") {
        fillPathInput.checked ? 
            ctx.fillRect(prevMouseX, prevMouseY, e.offsetX - prevMouseX, e.offsetY - prevMouseY) :
            ctx.strokeRect(prevMouseX, prevMouseY, e.offsetX - prevMouseX, e.offsetY - prevMouseY);
    } else if (selectedTool === "circle") {
        ctx.beginPath();
        let radius = Math.max(lineWidth * 0.5, Math.sqrt((e.offsetX - prevMouseX) * (e.offsetX - prevMouseX) + (e.offsetY - prevMouseY) * (e.offsetY - prevMouseY)));
        ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI);
        fillPathInput.checked ? ctx.fill() : ctx.stroke();
    } else if (selectedTool === "polygon") {
        ctx.beginPath();
        let radius = Math.max(lineWidth * 0.5, Math.sqrt((e.offsetX - prevMouseX) * (e.offsetX - prevMouseX) + (e.offsetY - prevMouseY) * (e.offsetY - prevMouseY)));
        let offset = Math.atan2(e.offsetY - prevMouseY, e.offsetX - prevMouseX);
        for (let i = 0; i < 5; i++) {
            let angle = offset + i / 5 * 2 * Math.PI;
            let x = prevMouseX + Math.cos(angle) * radius;
            let y = prevMouseY + Math.sin(angle) * radius;
            i == 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        fillPathInput.checked ? ctx.fill() : ctx.stroke();
    }
}

toolBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        document.getElementById(selectedTool)?.classList.remove("active");
        btn.classList.add("active");
        selectedTool = btn.id;
    });
});

lineWidthInput.addEventListener("change", () => lineWidth = lineWidthInput.value);

colorBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        selectedColor = window.getComputedStyle(btn).backgroundColor;
        colorText.textContent = selectedColor;
    });
});

resizeCanvasBtn.addEventListener("click", () => {
    canvas.width = canvasWidthInput.value;
    canvas.height = canvasHeightInput.value;
    canvas.style.width = `${canvasWidthInput.value}px`;
    canvas.style.height = `${canvasHeightInput.value}px`;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(snapshot, 0, 0);
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
});

viewport.addEventListener("mousedown", (e) => {
    startDraw(e);
    drawing(e);
});

viewport.addEventListener("mousemove", (e) => {
    if (isDragging && selectedRect !== undefined) {
        selectedRect.x += e.movementX;
        selectedRect.y += e.movementY;
    }
    drawing(e);
});

window.addEventListener("mouseup", async (e) => {
    if (isDrawing) {
        if (selectedTool !== "selection") {
            drawTool = false;
            drawing(e);
            drawTool = true;
            snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
            isDrawing = false;
        } else {
            isDrawing = false;
            if (prevMouseX === e.offsetX && prevMouseY === e.offsetY) {
                selectedRect = undefined;
                originalRect = undefined;
                selectedSnapshot = undefined;
            } else {
                selectedRect = {
                    x: prevMouseX,
                    y: prevMouseY,
                    w: e.offsetX - prevMouseX,
                    h: e.offsetY - prevMouseY
                };

                if (selectedRect.w < 0) {
                    selectedRect.x += selectedRect.w;
                    selectedRect.w = -selectedRect.w;
                }
                if (selectedRect.h < 0) {
                    selectedRect.y += selectedRect.h;
                    selectedRect.h = -selectedRect.h;
                }

                originalRect = {
                    x: selectedRect.x,
                    y: selectedRect.y,
                    w: selectedRect.w,
                    h: selectedRect.h
                };

                selectedSnapshot = undefined;
                drawTool = false;
                drawing(e);
                drawTool = true;
                selectedSnapshot = await window.createImageBitmap(ctx.getImageData(selectedRect.x, selectedRect.y, selectedRect.w, selectedRect.h));
            }
        }
    }

    if (isDragging) {
        isDragging = false;
    }
    
    drawing(e);
});
