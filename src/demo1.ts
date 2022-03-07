import * as advancedparticles from "./index";
import { ParticleState, SystemSettings } from "./index";

const containerDiv = document.getElementById("advanced_particles-container");
if (containerDiv === null) {
    throw new Error(
        "containerDiv was null (no div with id 'advanced_particles-container')"
    );
}

function d2h(d: number) {
    let s = (+d).toString(16);
    if (s.length < 2) {
        s = "0" + s;
    }
    return s;
}

const roundToNearest = (x: number, n: number) => Math.round(x / n) * n;
const floatToGrayColor = (num: number) =>
    "#" + d2h(roundToNearest(num * 255, 1)).repeat(3);

advancedparticles.init();
const { width, height } = containerDiv.getBoundingClientRect();
console.log(width, height);
let cursorPosition = { x: 0, y: 0 };
document.addEventListener("mousemove", (e) => {
    cursorPosition = { x: e.clientX, y: e.clientY };
});
// particles per sq pixel
const particleDensity = 0.001;
const maxLineRange = 60;
const settings: SystemSettings = {
    particleCount: width * height * particleDensity,
    sizeSupplier: (state: ParticleState) => {
        const dist = Math.sqrt(
            (cursorPosition.x - state.x) ** 2 +
                (cursorPosition.y - state.y) ** 2
        );
        return Math.max(Math.min(750 / dist, 7), 1);
    },
    speed: (state: ParticleState) => {
        const dist = Math.sqrt(
            (cursorPosition.x - state.x) ** 2 +
                (cursorPosition.y - state.y) ** 2
        );
        return Math.max(Math.min(750 / dist, 8), 3);
    },
    bounds: { x1: 0, y1: 0, x2: width, y2: height },
    colorSupplier: (state: ParticleState) => {
        //return '#353535ff'
        //if (((Math.max(state.x)/width + Math.max(0, state.y)/height)*255/2) < 0) {
        //    console.error(state);
        //}
        const dist = Math.sqrt(
            (cursorPosition.x - state.x) ** 2 +
                (cursorPosition.y - state.y) ** 2
        );
        return floatToGrayColor(Math.max(0, -(1 / 350) * dist + 1));
        return (
            "#" +
            parseInt(
                (
                    ((Math.max(state.x) / width +
                        Math.max(0, state.y) / height) *
                        255) /
                    2
                ).toFixed()
            )
                .toString(16)
                .repeat(3)
        );
    },
    maxLineRange,
    circleMode: "fill",
    lineColorSupplier: (state1: ParticleState, state2: ParticleState) => {
        const dist = Math.sqrt(
            (state2.x - state1.x) ** 2 + (state2.y - state1.y) ** 2
        );
        //return Math.sqrt((state2.x-state1.x)**2 + (state2.y-state1.y)**2) > 34 ? "#ffffff" : "#353535"
        return floatToGrayColor(-(1 / maxLineRange) * dist + 1);
    },
};
const startState = advancedparticles.generateInitialState(settings);
const ctx = (
    document.getElementById("advanced_particles-container")
        ?.firstElementChild as HTMLCanvasElement
)?.getContext("2d");
if (ctx === null) {
    throw Error("Render context was null.");
}
ctx.canvas.width = width;
ctx.canvas.height = height;

const debugDisplay = document.getElementById("debug_info");
const renderCallback = (info: Record<string, number>) => {
    let outText = "";
    for (const [key, value] of Object.entries(info)) {
        outText += `<div>${key}:</div><div>${value.toFixed(3)}</div>`;
    }
    debugDisplay!.innerHTML = outText;
    // -- variable things
};

export function start() {
    if (ctx === null) {
        throw Error("Render context was null.");
    }
    advancedparticles.nextFrame({
        ctx,
        settings,
        state: startState,
        renderCallback,
    });
}
