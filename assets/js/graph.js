const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const iconCache = {};

let graphData = null;
let angle = 0;
let zoom = calculateZoom();
let nodeMap = {};
let isZoomedIn = false;
let mainGraphPath = 'assets/js/graph.json';

let zoomTarget = null;
let zoomStart = null;
let zoomProgress = 0;
let panOffset = { x: 0, y: 0 };

const defaultRotationSpeed = 0.001;
const defaultnoteGraphAlpha = 0.12;
const zoomSpeed = 0.07;

let animatedGraph = true;
let rotationSpeed = 0.001;
let noteGraphAlpha = 0.12;

let hoveredNodeId = null;
let bannerBackArrow =null;

bannerBackArrow = document.getElementById('bannerArrow');

function updateArrowVisibility() {
    bannerBackArrow.style.display = isZoomedIn ? 'inline-flex' : 'none';
}

bannerBackArrow.addEventListener('click', () => {
    goBackToMainGraph();
    setBannerTitle();
    updateArrowVisibility();
});

const highlightedNodes = {
    "1": {
        label: "About",
        iconPath: "assets/icons/aboutMe.svg",
        action: () => {
            console.log("Clicked About");
            setBannerTitle("About");
            openModal("assets/popupwindows/about.html");
        }
    },
        "15": {
        label: "Skills",
        iconPath: "assets/icons/skills.svg",
        action: () => {
            console.log("Clicked Skills");
            setBannerTitle("Skills");
            openModal("assets/popupwindows/skills.html");
        }
    },
    "64": {
        label: "Projects",
        iconPath: "assets/icons/projects.svg",
        action: () => {
            console.log("Clicked Projects");
            setBannerTitle("Projects");
            zoomIntoNode("64", false);
            updateArrowVisibility();
        }
    },
    "176": {
        label: "Contact",
        iconPath: "assets/icons/contact.svg",
        action: () => {
            console.log("Clicked Contact");
            setBannerTitle("Contact");
            openModal("assets/popupwindows/contact.html");
        }
    },
    "230": {
        label: "Resume",
        iconPath: "assets/icons/cv.svg",
        action: () => {
            console.log("Clicked Resume");
            setBannerTitle("Resume");
            openModal("assets/popupwindows/resume.html");
        }
    },
    "B": {
        label: "Netflix Dashboard",
        iconPath: "assets/icons/analytics.svg",
        action: () => {
            console.log("Clicked B");
            openModal("assets/popupwindows/projects/netflixDashboard.html");
        }
    },
    "J": {
        label: "RogueLike Power System",
        iconPath: "assets/icons/magic-potion.svg",
        action: () => {
            console.log("Clicked J");
            openModal("assets/popupwindows/projects/roguelikePowerSystem.html");
        }
    },
    // "C": {
    //     label: "C",
    //     iconPath: null,
    //     action: null
    // },
    // "A": {
    //     label: "A",
    //     icon: null,
    //     action: null 
    // },
    // "D": {
    //     label: "D",
    //     iconPath: null,
    //     action: () => alert("Custom PH 2 behavior")
    // },
    // "E": {
    //     label: "E",
    //     iconPath: null,
    //     action: null
    // },
    "F": {
        label: "FPS Survival",
        iconPath: "assets/icons/fpsSurvival.svg",
        action: () => {
            console.log("Clicked F");
            openModal("assets/popupwindows/projects/fpsSurvival.html");
        }
    },
    // "G": {
    //     label: "G",
    //     iconPath: null,
    //     action: () => alert("Custom PH 2 behavior")
    // },
    "H": {
        label: "Churn Prediction",
        iconPath: "assets/icons/group.svg",
        action:  () => {
            console.log("Clicked Ha");
            openModal("assets/popupwindows/projects/churnPrediction.html");
        }
    }
};

const hudNodeStates = {};

for (const nodeId of Object.keys(highlightedNodes)) {
    hudNodeStates[nodeId] = {
        layers: [
            { radius: 15, segments: [[-Math.PI * 0.8, -Math.PI * 0.6], [Math.PI * 0.2, Math.PI * 0.4]], angle: 0, speed: 0.1 },
            { radius: 20, segments: [[Math.PI * 0.5, Math.PI * 0.8]], angle: 0, speed: -0.08 },
            { radius: 25, segments: [[-Math.PI * 0.3, Math.PI * 0.1]], angle: 0, speed: 0.06 },
        ]
    };
}

function preloadIcons() {
    const promises = Object.entries(highlightedNodes).map(([nodeId, data]) => {
        if (data.iconPath) {
            return new Promise(resolve => {
                const img = new Image();
                img.onload = () => resolve({ nodeId, img });
                img.onerror = () => resolve({ nodeId, img: null }); // fallback on error
                img.src = data.iconPath;
            });
        } else {
            return Promise.resolve({ nodeId, img: null });
        }
    });

    return Promise.all(promises).then(results => {
        for (const { nodeId, img } of results) {
            if (img) {
                iconCache[nodeId] = img;
            }
        }
    });
}

resizeCanvas();

window.addEventListener('resize', () => {
    resizeCanvas();
    zoom = calculateZoom();
});

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function calculateZoom() {
    const base = Math.min(canvas.width, canvas.height)*200;
    return Math.max(50, Math.min(base, 1000));
}

function loadGraph(path) {
    fetch(path)
        .then(res => res.json())
        .then(data => {
            graphData = data;
            angle = 0;
            zoom = calculateZoom();
        })
        .catch(err => console.error("Error loading graph:", err));
    noteGraphAlpha=defaultnoteGraphAlpha;
}

function zoomIntoNode(nodeId, animated=true) {
    diveIntoNode(nodeId, animated);
}

function goBackToMainGraph() {
    if (!isZoomedIn) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    noteGraphAlpha=defaultnoteGraphAlpha;
    rotationSpeed=defaultRotationSpeed;
    loadGraph("assets/js/graph.json");
    isZoomedIn = false;
    animatedGraph = true;
    zoom = calculateZoom();
    panOffset = { x: 0, y: 0 };
    setBannerTitle();
}


function diveIntoNode(nodeId, animated=true) {
    const node = nodeMap[nodeId];
    if (!node || isZoomedIn) return;

    zoomStart = zoom;
    zoomTarget = {
        zoom: zoom * 1.5,
        offsetX: canvas.width / 2 - node.x,
        offsetY: canvas.height / 2 - node.y
    };

    zoomProgress = 0;
    isZoomedIn = true;

    function animateZoom() {
        zoomProgress += zoomSpeed;
        noteGraphAlpha -= zoomSpeed * 0.12

        const t = Math.min(1, zoomProgress);
        zoom = zoomStart + t * (zoomTarget.zoom - zoomStart);
        panOffset.x = t * zoomTarget.offsetX;
        panOffset.y = t * zoomTarget.offsetY;

        if (t < 1) {
            requestAnimationFrame(animateZoom);
        } else {
            setTimeout(() => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                rotationSpeed=defaultRotationSpeed * 0.5;
                panOffset = { x: 0, y: 0 };
                loadGraph(`assets/js/${nodeId}.json`);
            }, 100);
        }
    }

    animateZoom();
}

function drawGraph(nodes, edges){
    /* Draws the NodeGraph using the coordinates */
    const maxWeight = Math.max(...edges.map(e => e.weight));

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const centerX = canvas.width / 2 + panOffset.x;
    const centerY = canvas.height / 2 + panOffset.y;

    for (const node of nodes) {
        const x = centerX + (node.x * cosA - node.y * sinA) * zoom;
        const y = centerY + (node.x * sinA + node.y * cosA) * zoom;
        nodeMap[node.id] = {
            x, y,
            screenX: x,
            screenY: y
        };
    }

    for (const edge of edges) {
        const src = nodeMap[edge.source];
        const tgt = nodeMap[edge.target];
        if (!src || !tgt) continue;

        const alpha = edge.weight / maxWeight * noteGraphAlpha;
        const weightColorScale = edge.weight / (maxWeight * 0.23);
        const r = Math.floor(0 + (35 - 139) * weightColorScale);
        const g = Math.floor(187 + (170 - 69) * weightColorScale);
        const b = Math.floor(249 + (102 - 19) * weightColorScale);

        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.stroke();
    }
}

function drawHighlightedNodeIcons(nodes){
    /*Sets the icons on the highlighted nodes*/
    ctx.font = "16px 'Tilt Neon', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const node of nodes) {
        if (highlightedNodes[node.id]) {
            const { screenX: x, screenY: y } = nodeMap[node.id];

            const { label } = highlightedNodes[node.id];
            const nodeIcon = iconCache[node.id];
            
            if (nodeIcon) {
                ctx.drawImage(nodeIcon, x-12, y-12, 24, 24); 

            } else {
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, 2 * Math.PI);
                ctx.fillStyle = `rgba(169, 195, 200, ${noteGraphAlpha * 8})`;
                ctx.fill();
            }

            if (node.id === hoveredNodeId) {
                const hud = hudNodeStates[node.id];
                if (hud) {
                    ctx.save();
                    ctx.translate(x, y); 
                
                    for (const layer of hud.layers) {
                        ctx.save();
                        ctx.rotate(layer.angle);
                        ctx.strokeStyle = `rgba(169, 195, 200, ${noteGraphAlpha * 5})`;
                        ctx.lineWidth = 2;
                
                        for (const [start, end] of layer.segments) {
                            ctx.beginPath();
                            ctx.arc(0, 0, layer.radius, start, end);
                            ctx.stroke();
                        }
                
                        ctx.restore();
                        layer.angle += layer.speed;
                    }
                
                    ctx.restore();
                }
            }

            ctx.fillStyle = "white";
            ctx.fillText(label, x, y - 20);

            nodeMap[node.id].screenX = x;
            nodeMap[node.id].screenY = y;
            }
    }
}

function animationLoop() {
    if (!graphData) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const { nodes, edges } = graphData;

    // Only update rotation if animation is enabled
    if (animatedGraph) {
        angle += rotationSpeed;
    }

    drawGraph(nodes, edges);
    drawHighlightedNodeIcons(nodes);

    requestAnimationFrame(animationLoop);
}



function animateGraph() {
    if (!graphData) return;
    if (!animatedGraph) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const { nodes, edges } = graphData;

    drawGraph(nodes, edges);
    drawHighlightedNodeIcons(nodes);




    angle += rotationSpeed;
    requestAnimationFrame(animateGraph);
}

    canvas.addEventListener("click", (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        for (const [nodeId, { label, action }] of Object.entries(highlightedNodes)) {
            const node = nodeMap[nodeId];
            if (!node) continue;

            const dx = mouseX - node.screenX;
            const dy = mouseY - node.screenY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 10) {
                console.log("Clicked on node:", nodeId, "->", label);
                if (typeof action === 'function') {
                    action();
                }
                break;
            }
        }
});

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    hoveredNodeId = null;


    for (const [nodeId, { label }] of Object.entries(highlightedNodes)) {
        const node = nodeMap[nodeId];
        if (!node || node.screenX === undefined) continue;

        const dx = mouseX - node.screenX;
        const dy = mouseY - node.screenY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 15) {
            hoveredNodeId = nodeId;
            break;
        }
    }

});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        goBackToMainGraph();
    }
});

Promise.all([
    fetch('assets/js/graph.json').then(res => res.json()),
    preloadIcons()
]).then(([data]) => {
    graphData = data;
animationLoop();
});
