const toolBtns = document.querySelectorAll(".tool");
const lineWidthInput = document.getElementById("lineWidth");
const fillPathInput = document.getElementById("fillPath");
const colorBtns = document.querySelectorAll(".colors li");
const saturationValuePicker = document.getElementById("saturationValuePicker");
const huePicker = document.getElementById("huePicker");
const colorInput = document.getElementById("color");
const canvasWidthInput = document.getElementById("canvasWidth");
const canvasHeightInput = document.getElementById("canvasHeight");
const resizeCanvasBtn = document.getElementById("resizeCanvas");
const downloadCanvasBtn = document.getElementById("downloadCanvas");
const viewport = document.querySelector("main");
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

let prevMouseX = undefined;
let prevMouseY = undefined;
let snapshot = undefined;
let isDrawing = false;
let isDragging = false;
let isSaturing = false;
let isHueing = false;
let drawTool = true;
let selectedTool = "brush";
let selectedColor = "#000000ff";
let selectedHue = 0;
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

    setSelectedColor(selectedColor);

    lineWidthInput.value = lineWidth;
    fillPathInput.checked = false;
    canvasWidthInput.value = canvas.width;
    canvasHeightInput.value = canvas.height;
});

function rgbToHue(rgb) {
    let r = rgb.r / 255.0;
    let g = rgb.g / 255.0;
    let b = rgb.b / 255.0;
    if (r > g && r > b) return ((g - b) / (Math.max(r, g, b) - Math.min(r, g, b))) / 6.0;
    if (g > b) return (2.0 + (b - r) / (Math.max(r, g, b) - Math.min(r, g, b))) / 6.0;
    return (4.0 + (r - g) / (Math.max(r, g, b) - Math.min(r, g, b))) / 6.0;
}

function hsvToRgb(hsv) {
    let c = hsv.v * hsv.s * 255;
    let x = c * (1 - Math.abs(((hsv.h * 6) % 2) - 1));
    let rgb;
    if (hsv.h * 360 < 60) rgb = { r: c, g: x, b: 0, a: 255 };
    else if (hsv.h * 360 < 120) rgb = { r: x, g: c, b: 0, a: 255 };
    else if (hsv.h * 360 < 180) rgb = { r: 0, g: c, b: x, a: 255 };
    else if (hsv.h * 360 < 240) rgb = { r: 0, g: x, b: c, a: 255 };
    else if (hsv.h * 360 < 300) rgb = { r: x, g: 0, b: c, a: 255 };
    else rgb = { r: c, g: 0, b: x, a: 255 };
    rgb.r += hsv.v * 255 - c;
    rgb.g += hsv.v * 255 - c;
    rgb.b += hsv.v * 255 - c;
    return rgb;
}

function stringToRgb(str) {
    const fromHex = (num) => parseInt(num, 16);
    return {
        r: fromHex(selectedColor.substring(1, 3)),
        g: fromHex(selectedColor.substring(3, 5)),
        b: fromHex(selectedColor.substring(5, 7)),
        a: 255
    };
}

function rgbToString(rgb) {
    const toHex = (num) => Math.round(num).toString(16).padStart(2, '0');
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}${toHex(rgb.a)}`;
}

function setSelectedColor(color) {
    selectedColor = color;
    colorInput.value = color.substring(1);
    colorInput.style.backgroundColor = color;

    let rgb = stringToRgb(color);
    colorInput.style.color = Math.max(rgb.r, rgb.g, rgb.b) / 255.0 < 0.5 ? 'white' : 'black';

    let hsv = { h: rgbToHue(rgb), s: 1.0, v: 1.0 };
    if (!isNaN(hsv.h)) {
        selectedHue = hsv.h;
        rgb = hsvToRgb(hsv);
        saturationValuePicker.style.backgroundImage = `linear-gradient(white, black),linear-gradient(to right, white, ${rgbToString(rgb)})`;
    }
}

function setSaturationLight(e) {
    if (!isSaturing) return;

    let hsv = { h: selectedHue, s: e.offsetX / saturationValuePicker.offsetWidth, v: 1.0 - e.offsetY / saturationValuePicker.offsetHeight };
    if (hsv.s < 0.0 || hsv.s > 1.0 || hsv.v < 0.0 || hsv.v > 1.0) return;

    let rgb = hsvToRgb(hsv);
    setSelectedColor(rgbToString(rgb));
}

function setHue(e) {
    if (!isHueing) return;

    let hsv = { h: e.offsetX / huePicker.offsetWidth, s: 1.0, v: 1.0 };
    if (hsv.h < 0.0 || hsv.h > 1.0) return;

    selectedHue = hsv.h;
    let rgb = hsvToRgb(hsv);
    saturationValuePicker.style.backgroundImage = `linear-gradient(white, black),linear-gradient(to right, white, ${rgbToString(rgb)})`;
}

function startDraw(e) {
    prevMouseX = e.clientX - canvas.getBoundingClientRect().x;
    prevMouseY = e.clientY - canvas.getBoundingClientRect().y;
    if (selectedTool === "selection" && selectedRect !== undefined && e.offsetX >= selectedRect.x && e.offsetX < selectedRect.x + selectedRect.w && e.offsetY >= selectedRect.y && e.offsetY < selectedRect.y + selectedRect.h) {
        isDragging = true;
    } else {

        if (selectedSnapshot !== undefined) {
            drawTool = false;
            drawing(e);
            drawTool = true;
            snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

            selectedRect = undefined;
            originalRect = undefined;
            selectedSnapshot = undefined;
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

    let cursorX = e.clientX - canvas.getBoundingClientRect().x;
    let cursorY = e.clientY - canvas.getBoundingClientRect().y;
    
    viewport.style.cursor = 'crosshair';
    if (!isDrawing) {

        if (selectedTool === "selection" && selectedRect !== undefined) {
            let x = cursorX - selectedRect.x;
            let y = cursorY - selectedRect.y;
            if (isDragging || (x >= 0 && x < selectedRect.w && y >= 0 && y < selectedRect.h)) {
                viewport.style.cursor = 'move';
            } else if (x >= -16 && x < selectedRect.w + 16 && y >= -16 && y < selectedRect.h + 16) {
                if ((x < 16 && y < 16) || (x > selectedRect.w - 16 && y > selectedRect.h - 16)) viewport.style.cursor = 'nwse-resize';
                else if ((x < 16 && y > selectedRect.h - 16) || (x > selectedRect.w - 16 && y < 16)) viewport.style.cursor = 'nesw-resize';
                else if (x < 0 || x > selectedRect.w) viewport.style.cursor = 'ew-resize';
                else if (y < 0 || y > selectedRect.h) viewport.style.cursor = 'ns-resize';
                //'grab'
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
            ctx.arc(cursorX, cursorY, lineWidth * 0.5, 0, 2 * Math.PI);
            selectedTool === "eraser" ? ctx.stroke() : ctx.fill();
        }

        return;
    }

    if (selectedTool === "selection") {
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = "white";
        ctx.globalCompositeOperation = "difference";
        ctx.strokeRect(prevMouseX, prevMouseY, cursorX - prevMouseX, cursorY - prevMouseY);
    } else if (selectedTool === "brush" || selectedTool === "eraser") {
        ctx.lineTo(cursorX, cursorY);
        ctx.stroke();
    } else if (selectedTool === "spray") {
        for (let i = 0; i < lineWidth; i++) {
            let radius = Math.sqrt(Math.random()) * lineWidth;
            let angle = Math.random() * 2 * Math.PI;
            let x = Math.floor(cursorX + Math.cos(angle) * radius);
            let y = Math.floor(cursorY + Math.sin(angle) * radius);
            if (x >= 0 && x < snapshot.width && y >= 0 && y < snapshot.height) {
                let color = stringToRgb(selectedColor);
                snapshot.data[(x + y * snapshot.width) * 4 + 0] = color.r * color.a / 255.0 + snapshot.data[(x + y * snapshot.width) * 4 + 0] * (1.0 - color.a / 255.0);
                snapshot.data[(x + y * snapshot.width) * 4 + 1] = color.g * color.a / 255.0 + snapshot.data[(x + y * snapshot.width) * 4 + 1] * (1.0 - color.a / 255.0);
                snapshot.data[(x + y * snapshot.width) * 4 + 2] = color.b * color.a / 255.0 + snapshot.data[(x + y * snapshot.width) * 4 + 2] * (1.0 - color.a / 255.0);
                snapshot.data[(x + y * snapshot.width) * 4 + 3] = color.a * color.a / 255.0 + snapshot.data[(x + y * snapshot.width) * 4 + 3] * (1.0 - color.a / 255.0);
            }
        }
    } else if (selectedTool === "eyedropper") {
        let x = Math.floor(cursorX);
        let y = Math.floor(cursorY);
        if (x >= 0 && x < snapshot.width && y >= 0 && y < snapshot.height) {
            let rgb = {
                r: snapshot.data[(x + y * snapshot.width) * 4 + 0],
                g: snapshot.data[(x + y * snapshot.width) * 4 + 1],
                b: snapshot.data[(x + y * snapshot.width) * 4 + 2],
                a: snapshot.data[(x + y * snapshot.width) * 4 + 3]
            };
            setSelectedColor(rgbToString(rgb));
        }
    } else if (selectedTool === "line") {
        ctx.beginPath();
        ctx.moveTo(prevMouseX, prevMouseY);
        ctx.lineTo(cursorX, cursorY);
        ctx.stroke();
    } else if (selectedTool === "rectangle") {
        fillPathInput.checked ? 
            ctx.fillRect(prevMouseX, prevMouseY, cursorX - prevMouseX, cursorY - prevMouseY) :
            ctx.strokeRect(prevMouseX, prevMouseY, cursorX - prevMouseX, cursorY - prevMouseY);
    } else if (selectedTool === "circle") {
        ctx.beginPath();
        let radius = Math.max(lineWidth * 0.5, Math.sqrt((cursorX - prevMouseX) * (cursorX - prevMouseX) + (cursorY - prevMouseY) * (cursorY - prevMouseY)));
        ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI);
        fillPathInput.checked ? ctx.fill() : ctx.stroke();
    } else if (selectedTool === "polygon") {
        ctx.beginPath();
        let radius = Math.max(lineWidth * 0.5, Math.sqrt((cursorX - prevMouseX) * (cursorX - prevMouseX) + (cursorY - prevMouseY) * (cursorY - prevMouseY)));
        let offset = Math.atan2(cursorY - prevMouseY, cursorX - prevMouseX);
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
        setSelectedColor(`#${btn.dataset.color}`);
    });
});

saturationValuePicker.addEventListener("mousedown", (e) => { isSaturing = true; setSaturationLight(e); });
saturationValuePicker.addEventListener("mousemove", setSaturationLight);
saturationValuePicker.addEventListener("mouseup", (e) => isSaturing = false);

huePicker.addEventListener("mousedown", (e) => { isHueing = true; setHue(e); });
huePicker.addEventListener("mousemove", setHue);
huePicker.addEventListener("mouseup", (e) => isHueing = false);

colorInput.addEventListener("change", () => setSelectedColor(`#${colorInput.value}`));

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

downloadCanvasBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `${Date.now()}.jpg`;
    link.href = canvas.toDataURL();
    link.click();
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

            let cursorX = e.clientX - canvas.getBoundingClientRect().x;
            let cursorY = e.clientY - canvas.getBoundingClientRect().y;

            if (prevMouseX === cursorX && prevMouseY === cursorY) {
                selectedRect = undefined;
                originalRect = undefined;
                selectedSnapshot = undefined;
            } else {
                selectedRect = {
                    x: prevMouseX,
                    y: prevMouseY,
                    w: cursorX - prevMouseX,
                    h: cursorY - prevMouseY
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
